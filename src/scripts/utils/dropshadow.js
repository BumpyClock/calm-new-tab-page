function generateBoxShadow(color, elevation, opacity, blur, ) {
  try {
    let parsedColor = tinycolor(`rgb(${color.r}, ${color.g}, ${color.b})`);
    if (!parsedColor.isValid()) {
      throw new Error('Invalid color');
    }
    const theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    parsedColor = adjustColorForTheme(parsedColor, theme);
    const hsl = parsedColor.toHsl();
    const layerAmount = Math.max(3, elevation); // At least 3 layers, or as many as the elevation

    const boxShadows = [];
    for (let i = 0; i < layerAmount; i++) {
      const blurValue = (i + 1) * blur;
      const alpha = (i + 1) * (opacity / layerAmount);
      boxShadows.push(`${0}px ${0}px ${blurValue}px hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%, ${alpha})`);
    }

    return boxShadows.join(", ");
  } catch (error) {
    console.error('Error in generateBoxShadow:', error);
    return null; // or render some fallback UI
  }
}

function adjustColorForTheme(color, theme) {
  const percent = 10;
  const hsl = color.toHsl();
  if (hsl.l <= 0.2) { // if the color is already dark
    hsl.l += (1 - hsl.l) * (percent / 100); // Lighten the color
  }
  if (theme === 'dark') {
    hsl.s = Math.min(1, hsl.s * 1.2); // Increase saturation by 20%
    hsl.l = Math.max(0, hsl.l * 0.8); // Decrease luminance by 20%
  } else {
    hsl.s = Math.min(0.4, hsl.s * (1 + 5 / 100)); // Increase saturation
    hsl.l = Math.min(0.4, hsl.l * (1 + 5 / 100)); // Increase luminance
  }
  return tinycolor(hsl);
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