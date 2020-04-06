
P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord )
{
	P_COLOR vec4 ret = vec4(
		texCoord.x,
		texCoord.y,
		abs(sin(CoronaTotalTime)),
		1);

    return CoronaColorScale(ret);    
}
