const verifyItems = (values, types) => {
    if (values.length != types.length) return false;
    for (let i = 0; i < values.length; i++) {
        const item = values.at(i);
        if (typeof item !== types.at(i)) return false;
    }
    return true;
}

export default verifyItems;