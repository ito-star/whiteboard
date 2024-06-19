function getValue(transformer, propValue) {
  if (typeof propValue === "string") {
    return propValue;
  }

  const abs = Math.abs(propValue);
  const transformed = transformer(abs);

  if (propValue >= 0) {
    return transformed;
  }

  if (typeof transformed === "number") {
    return -transformed;
  }

  return `-${transformed}`;
}

export default getValue;
