
P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord )
{
	const P_COLOR vec4 kRed = 
		vec4( 1.0, 0.0, 0.0, 1.0 );

	const P_COLOR vec4 kGreen =
		vec4( 0.0, 1.0, 0.0, 1.0 );

	const P_COLOR vec4 kBlue =
		vec4( 0.0, 0.0, 1.0, 1.0 );

	// Try replacing kRed with kGreen or kBlue
	return CoronaColorScale( kRed );
}
