
P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord )
{
	// normalize to the center
	texCoord = texCoord - 0.5;
	// cartesian to polar coordinates
	P_COLOR float r = length(texCoord);
	P_COLOR float a = atan(texCoord.y, texCoord.x);
	P_COLOR float rOriginal = r;
	// distort
	r = r*r; // bulge
	// r = sqrt(r); // pinch
	// Control the intensity
	r = mix( rOriginal, r, CoronaVertexUserData.x );
	// polar to cartesian coordinates
	texCoord = r * vec2(cos(a), sin(a));
	P_COLOR vec4 texColor = texture2D( CoronaSampler0, texCoord + 0.5 );
	// Modulate by object's alpha/tint
	return CoronaColorScale( texColor );
}
