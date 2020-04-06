// inspired by The Book of Shaders by Patricio Gonzalez Vivo
// http://patriciogonzalezvivo.com/2015/thebookofshaders/

#define PI 3.1415926535
#define HALF_PI 1.57079632679


P_RANDOM vec3 sphereNormals( in P_RANDOM vec2 uv) {
    uv = fract(uv)*2.0-1.0; 
    P_RANDOM vec3 ret;
    ret.xy = sqrt(uv * uv) * sign(uv);
    ret.z = sqrt(abs(1.0 - dot(ret.xy,ret.xy)));
    ret = ret * 0.5 + 0.5;    
    return mix(vec3(0.0), ret, smoothstep(1.0,0.98,dot(uv,uv)) );
}

P_RANDOM vec2 sphereCoords(P_RANDOM vec2 _st, P_RANDOM float _scale){
    P_RANDOM float maxFactor = sin(1.570796327);
    P_RANDOM vec2 uv = vec2(0.0);
    P_RANDOM vec2 xy = 2.0 * _st.xy - 1.0;
    P_RANDOM float d = length(xy);
    if (d < (2.0-maxFactor)){
        d = length(xy * maxFactor);
        P_RANDOM float z = sqrt(1.0 - d * d);
        P_RANDOM float r = atan(d, z) / 3.1415926535 * _scale;
        P_RANDOM float phi = atan(xy.y, xy.x);

        uv.x = r * cos(phi) + 0.5;
        uv.y = r * sin(phi) + 0.5;
    } else {
        uv = _st.xy;
    }
    return uv;
}

P_RANDOM vec4 sphereTexture(in sampler2D _tex, in P_RANDOM vec2 _uv) {
    P_RANDOM vec2 st = sphereCoords(_uv, 1.0);

    P_RANDOM float aspect = CoronaTexelSize.x/CoronaTexelSize.y;
    st.x = fract(st.x*aspect + CoronaTotalTime*CoronaVertexUserData.y);

    return texture2D(_tex, st);
}

P_COLOR vec4 FragmentKernel( P_UV vec2 texCoord ){

    P_RANDOM vec2 st = texCoord;
    P_RANDOM vec3 color = vec3(1.0);
  
    color *= sphereTexture(CoronaSampler0, st).rgb;

    P_RANDOM vec3 sunPos;
    // Calculate sun direction
    if(CoronaVertexUserData.z>-19.0) {
        sunPos = normalize(vec3(cos(CoronaVertexUserData.z),0.0,sin(CoronaVertexUserData.z)));
    }else
    {
        sunPos = normalize(vec3(cos(CoronaTotalTime*CoronaVertexUserData.w-0.2*HALF_PI),0.0,sin(CoronaVertexUserData.w*CoronaTotalTime-0.2*HALF_PI)));
    }
    P_RANDOM vec3 surface = normalize(sphereNormals(st)*2.0-1.0);
   
    // Add Shadows
    color *= dot(sunPos,surface);

    // Blend black the edge of the sphere
    P_RANDOM float radius = 1.0-length( vec2(0.5)-st )*2.0;
    P_RANDOM float smoothRadius = smoothstep(0.001,0.05,radius);
    color *= smoothRadius;
    // color = 1.0-color;

    // vec4 ret = vec4(color,1.0);

    P_RANDOM vec4 ret = vec4(color,smoothRadius);


    return CoronaColorScale(ret);
}

