function getInfo(ctrler) {
    return {
        ...ctrler.config,
        status: ctrler.lifePeriod,
    };
}
export { getInfo as default, getInfo, };
//# sourceMappingURL=getInfo.js.map