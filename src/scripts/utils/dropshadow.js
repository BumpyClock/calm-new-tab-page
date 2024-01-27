function generateBoxShadow(color, elevation, opacity, blur, horizontalDistance) {
  try {
    let parsedColor = tinycolor(`rgb(${color.r}, ${color.g}, ${color.b})`);
    if (!parsedColor.isValid()) {
      throw new Error('Invalid color');
    }
    parsedColor = makeVibrant(parsedColor, 5);
    const hsl = parsedColor.toHsl();
    const layerAmount = Math.max(3, elevation); // At least 3 layers, or as many as the elevation

    const boxShadows = [];
    for (let i = 0; i < layerAmount; i++) {
      const x = (i + 1) * horizontalDistance;
      const y = (i + 1) * elevation;
      const blurValue = (i + 1) * blur;
      const alpha = (i + 1) * (opacity / layerAmount);
      boxShadows.push(`${x}px ${y}px ${blurValue}px hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${alpha})`);
    }

    return boxShadows.join(", ");
  } catch (error) {
    console.error('Error in generateBoxShadow:', error);
    return null; // or render some fallback UI
  }
}

function makeVibrant(color, percent) {
  const hsl = color.toHsl();
  if (hsl.l <= 0.2) { // if the color is already dark
    hsl.l += (1 - hsl.l) * (percent / 100); // Lighten the color
  } else {
    hsl.s = Math.min(0.4, hsl.s * (1 + percent / 100)); // Increase saturation
    hsl.l = Math.min(0.4, hsl.l * (1 + percent / 100)); // Increase luminance
  }
  return tinycolor(hsl);
}