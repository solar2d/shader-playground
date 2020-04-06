//learn more @ http://www.bidouille.org/prog/plasma

#define PI 3.1415926535

P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord )
{
    P_UV vec2 scale = CoronaVertexUserData.xy;
    P_COLOR float v = 0.0;
    P_UV vec2 c = texCoord * scale - scale/2.0;
    v += sin((c.x+CoronaTotalTime));
    v += sin((c.y+CoronaTotalTime)/2.0);
    v += sin((c.x+c.y+CoronaTotalTime)/2.0);
    c += scale/2.0 * vec2(sin(CoronaTotalTime/3.0), cos(CoronaTotalTime/2.0));
    v += sin(sqrt(c.x*c.x+c.y*c.y+1.0)+CoronaTotalTime);
    v = v/2.0;
    P_COLOR vec3 col = vec3(1, sin(PI*v), cos(PI*v));
    return CoronaColorScale(vec4(col*.5 + .5, 1));
}
