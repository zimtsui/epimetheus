function getInfo(recaller) {
    var _a, _b, _c;
    const { config } = recaller;
    return {
        name: config.name,
        path: config.path,
        cwd: config.cwd,
        args: config.args,
        nodeArgs: config.nodeArgs,
        recallerStatus: recaller.lifePeriod,
        invokerStatus: (_a = recaller.invoker) === null || _a === void 0 ? void 0 : _a.lifePeriod,
        pid: (_c = (_b = recaller.invoker) === null || _b === void 0 ? void 0 : _b.subp) === null || _c === void 0 ? void 0 : _c.pid,
    };
}
export { getInfo as default, getInfo, };
//# sourceMappingURL=getInfo.js.map