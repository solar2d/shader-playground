
P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord )
{
	P_COLOR float brightness = 0.5;
	P_COLOR vec4 texColor = texture2D( CoronaSampler0, texCoord );

	// Pre-multiply the alpha to brightness
	brightness = brightness * texColor.a;

	// Add the brightness
	texColor.rgb += brightness;

	// Modulate by the display object's combined alpha/tint.
	return CoronaColorScale( texColor );
}
