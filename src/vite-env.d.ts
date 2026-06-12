declare module '*.css' {
    const content: { [className: string]: string };
    export default content; // 💡 關鍵就在補上了 export 這幾個字！
}