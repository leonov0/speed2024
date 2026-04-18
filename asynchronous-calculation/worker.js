onmessage = function (e) {
    let result = 0;

    for (let i = 1; i <= e.data; i++) {
        result += i;
        postMessage({ progress: Math.floor(i / e.data * 100), result })
    }
}