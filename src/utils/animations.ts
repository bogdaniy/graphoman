export interface AnimSyncObject {
    requestId?: number;
}

export const animationLoop = (
    callback: (valuePart: number) => void, 
    value: number,
    duration: number,
    obj: AnimSyncObject = { requestId: undefined },
) => {
    const start = performance.now();
    let lastProgress = 0;
    let total = value;

    const tick = (now: number) => {;
        const elapsed = now - start;
        const progress = elapsed / duration;
        const partValue = (progress - lastProgress) * value;        
        lastProgress = progress;
        
        if (progress >= 1) {
            callback(total);
            obj.requestId = undefined;
            return;   
        }

        total -= partValue;
        callback(partValue);
        obj.requestId = requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
}  
  
  