// FM 合成器 AudioWorklet 处理器
// 实现：相位累加 + FM 方程 + ADSR + LFO

class FMVoiceProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.carrierPhase = 0;
        this.modPhase = 0;
        this.lfoPhase = 0;

        this.params = {
            carrierHz: 220,
            modRatio: 2,
            fmIndex: 60,
            attackTime: 0.02,
            decayTime: 0.12,
            sustainLevel: 0.6,
            releaseTime: 0.2,
            lfoRate: 5,
            lfoDepth: 0.25,
            lfoTarget: 'pitch'
        };

        this.adsrState = 'idle';
        this.adsrEnvelope = 0;
        this.adsrTime = 0;
        this.isNoteOn = false;
        this.noteVelocity = 1;

        this.events = [];

        this.port.onmessage = (e) => {
            const { type, data } = e.data || {};
            if (!type) return;

            if (type === 'noteOn') {
                const velocity = data?.velocity ?? 1;
                const freq = data?.freq ?? this.params.carrierHz;
                this.startNote(freq, velocity);
            } else if (type === 'noteOff') {
                this.noteOff();
            } else if (type === 'set') {
                if (data?.key) {
                    this.params[data.key] = data.value;
                }
            } else if (type === 'noteAt') {
                const payload = data || {};
                this.events.push({
                    type: 'note',
                    time: payload.time ?? payload.t ?? 0,
                    freq: payload.freq,
                    velocity: payload.velocity ?? 1,
                    length: payload.length ?? payload.len ?? 0.1
                });
                this.events.sort((a, b) => a.time - b.time);
            } else if (type === 'paramAt') {
                const payload = data || {};
                if (payload.key !== undefined) {
                    this.events.push({
                        type: 'param',
                        time: payload.time ?? payload.t ?? 0,
                        key: payload.key,
                        value: payload.value
                    });
                    this.events.sort((a, b) => a.time - b.time);
                }
            }
        };
    }

    startNote(freq, velocity = 1) {
        this.params.carrierHz = freq;
        this.noteVelocity = Math.max(0, Math.min(1, velocity));
        this.isNoteOn = true;
        this.adsrState = 'attack';
        this.adsrTime = 0;
    }

    noteOn(freq) {
        this.startNote(freq, 1);
    }

    noteOff() {
        if (this.isNoteOn) {
            this.isNoteOn = false;
            this.adsrState = 'release';
            this.adsrTime = 0;
        }
    }

    computeADSR(deltaTime) {
        this.adsrTime += deltaTime;

        switch (this.adsrState) {
            case 'idle':
                this.adsrEnvelope = 0;
                break;
            case 'attack':
                if (this.params.attackTime > 0) {
                    this.adsrEnvelope = Math.min(1, this.adsrTime / this.params.attackTime);
                    if (this.adsrTime >= this.params.attackTime) {
                        this.adsrState = 'decay';
                        this.adsrTime = 0;
                    }
                } else {
                    this.adsrEnvelope = 1;
                    this.adsrState = 'decay';
                    this.adsrTime = 0;
                }
                break;
            case 'decay':
                if (this.params.decayTime > 0) {
                    const decay = 1 - (this.adsrTime / this.params.decayTime);
                    this.adsrEnvelope = this.params.sustainLevel + (1 - this.params.sustainLevel) * Math.max(0, decay);
                    if (this.adsrTime >= this.params.decayTime) {
                        this.adsrState = 'sustain';
                        this.adsrEnvelope = this.params.sustainLevel;
                    }
                } else {
                    this.adsrEnvelope = this.params.sustainLevel;
                    this.adsrState = 'sustain';
                }
                break;
            case 'sustain':
                this.adsrEnvelope = this.params.sustainLevel;
                break;
            case 'release':
                if (this.params.releaseTime > 0) {
                    const releaseStart = this.adsrEnvelope;
                    this.adsrEnvelope = releaseStart * (1 - this.adsrTime / this.params.releaseTime);
                    if (this.adsrTime >= this.params.releaseTime) {
                        this.adsrState = 'idle';
                        this.adsrEnvelope = 0;
                    }
                } else {
                    this.adsrState = 'idle';
                    this.adsrEnvelope = 0;
                }
                break;
        }

        return Math.max(0, this.adsrEnvelope);
    }

    process(inputs, outputs) {
        const output = outputs[0];
        const leftChannel = output[0];
        const rightChannel = output[1];

        if (!leftChannel) return true;

        const sr = sampleRate;
        const deltaTime = 1 / sr;
        const blockStart = currentTime;
        const blockFrames = leftChannel.length;
        const blockEnd = blockStart + blockFrames / sr;

        const due = [];
        const future = [];
        const epsilon = 1e-5;

        for (const ev of this.events) {
            if (ev.time <= blockEnd + epsilon) {
                due.push(ev);
            } else {
                future.push(ev);
            }
        }
        this.events = future;

        const triggerQueue = [];
        const automationQueue = [];
        const extraFuture = [];

        for (const ev of due) {
            const offset = Math.max(0, Math.floor((ev.time - blockStart) * sr));
            if (offset > blockFrames) continue;

            if (ev.type === 'note') {
                triggerQueue.push({
                    offset,
                    kind: 'on',
                    freq: ev.freq,
                    velocity: ev.velocity ?? 1
                });

                const offTime = ev.time + ev.length;
                if (offTime <= blockEnd + epsilon) {
                    const offOffset = Math.max(0, Math.floor((offTime - blockStart) * sr));
                    if (offOffset <= blockFrames) {
                        triggerQueue.push({ offset: offOffset, kind: 'off' });
                    }
                } else {
                    extraFuture.push({ type: 'noteOff', time: offTime });
                }
            } else if (ev.type === 'noteOff') {
                triggerQueue.push({ offset, kind: 'off' });
            } else if (ev.type === 'param') {
                automationQueue.push({
                    offset,
                    key: ev.key,
                    value: ev.value
                });
            }
        }

        if (extraFuture.length) {
            this.events = this.events.concat(extraFuture);
            this.events.sort((a, b) => a.time - b.time);
        }

        triggerQueue.sort((a, b) => a.offset - b.offset);
        automationQueue.sort((a, b) => a.offset - b.offset);

        let triggerIndex = 0;
        let automationIndex = 0;

        for (let i = 0; i < blockFrames; i++) {
            while (triggerIndex < triggerQueue.length && triggerQueue[triggerIndex].offset === i) {
                const trig = triggerQueue[triggerIndex];
                if (trig.kind === 'on') {
                    this.startNote(trig.freq, trig.velocity);
                } else {
                    this.noteOff();
                }
                triggerIndex++;
            }

            while (automationIndex < automationQueue.length && automationQueue[automationIndex].offset === i) {
                const auto = automationQueue[automationIndex];
                if (auto.key) {
                    this.params[auto.key] = auto.value;
                }
                automationIndex++;
            }

            const envelope = this.computeADSR(deltaTime);

            const lfoValue = Math.sin(this.lfoPhase * Math.PI * 2);
            this.lfoPhase += this.params.lfoRate / sr;
            if (this.lfoPhase >= 1) this.lfoPhase -= 1;

            let carrierFreq = this.params.carrierHz;
            let ampMod = 1;
            let fmIndex = this.params.fmIndex;
            let modRatio = this.params.modRatio;
            const depth = this.params.lfoDepth;

            switch (this.params.lfoTarget) {
                case 'pitch': {
                    const pitchMod = Math.pow(2, (lfoValue * depth * 0.5) / 12);
                    carrierFreq *= pitchMod;
                    break;
                }
                case 'amp': {
                    ampMod = 1 + lfoValue * depth * 0.3;
                    break;
                }
                case 'fmIndex': {
                    const scale = 1 + lfoValue * depth * 1.2;
                    fmIndex = Math.max(0, this.params.fmIndex * scale);
                    break;
                }
                case 'modRatio': {
                    modRatio = Math.max(0.25, this.params.modRatio + lfoValue * depth * 0.8);
                    break;
                }
                default:
                    break;
            }

            const modFreq = carrierFreq * modRatio;
            const modulator = Math.sin(this.modPhase * Math.PI * 2);
            const carrier = Math.sin((this.carrierPhase * Math.PI * 2) + (fmIndex * modulator));

            this.carrierPhase += carrierFreq / sr;
            this.modPhase += modFreq / sr;

            if (this.carrierPhase >= 1) this.carrierPhase -= 1;
            if (this.modPhase >= 1) this.modPhase -= 1;

            const sample = carrier * envelope * ampMod * this.noteVelocity * 0.3;

            leftChannel[i] = sample;
            if (rightChannel) {
                rightChannel[i] = sample;
            }
        }

        return true;
    }
}

registerProcessor('fm-voice-processor', FMVoiceProcessor);
