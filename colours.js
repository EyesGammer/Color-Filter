const kumo_filter = {
    red: 0,
    green: 0,
    blue: 0,
    gamma: 0.16666666666666666,
    alpha: 1,
    target: null,
    targetHSL: null,
    setBase: ( red, green, blue ) => {
        kumo_filter.red = kumo_filter.clamp( red );
        kumo_filter.green = kumo_filter.clamp( green );
        kumo_filter.blue = kumo_filter.clamp( blue );
        kumo_filter.target = { red: kumo_filter.red, green: kumo_filter.green, blue: kumo_filter.blue };
        kumo_filter.targetHSL = kumo_filter.hsl( kumo_filter.target.red, kumo_filter.target.green, kumo_filter.target.blue );
    },
    getBase: () => ( { red: kumo_filter.red ?? 0, green: kumo_filter.green ?? 0, blue: kumo_filter.blue ?? 0 } ),
    toString: () => `rgb(${ Math.round( kumo_filter.red ?? 0 ) }, ${ Math.round( kumo_filter.green ?? 0 ) }, ${ Math.round( kumo_filter.blue ?? 0 ) })`,
    hexToRGB: input => {
        input = input.replace( /^#?([a-f\d])([a-f\d])([a-f\d])$/i, ( _, r, g, b ) => r + r + g + g + b + b );
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( input );
        return result ? {
            red: parseInt( result[ 1 ], 16 ),
            green: parseInt( result[ 2 ], 16 ),
            blue: parseInt( result[ 3 ], 16 )
        } : null;
    },
    clamp: value => {
        if( value > 255 ) return 255;
        else if( value < 0 ) return 0;
        return value;
    },
    solve: ( colorHex=null ) => {
        if( colorHex !== null && ( temp_color = kumo_filter.hexToRGB( colorHex ) ) !== null ) kumo_filter.setBase( temp_color.red, temp_color.green, temp_color.blue );
        return kumo_filter.css( kumo_filter.solveNarrow( kumo_filter.solveWide() ).values );
    },
    solveNarrow: wide => kumo_filter.spsa(
        wide.loss,
        [ 0.25 * ( wide.loss + 1 ), 0.25 * ( wide.loss + 1 ), ( wide.loss + 1 ), 0.25 * ( wide.loss + 1 ), 0.2 * ( wide.loss + 1 ), 0.2 * ( wide.loss + 1 ) ],
        2,
        wide.values,
        500
    ),
    solveWide: () => {
        let best = { loss: Infinity };
        for( let i = 0; best.loss > 25 && i < 3; i++ ) if( ( result = kumo_filter.spsa(
            5,
            [ 60, 180, 18000, 600, 1.2, 1.2 ],
            15,
            [ 50, 20, 3750, 50, 100, 100 ],
            1000
        ) ).loss < best.loss ) best = result;
        return best;
    },
    fix: ( value, id ) => {
        max = 100;
        if( id === 2 ) max = 7500;
        else if( id === 4 || id === 5 ) max = 200;
        if( id === 3 ) {
            if( value > max ) value %= max;
            else if( value < 0 ) value = max + value % max;
        } else if( value < 0 ) value = 0;
        else if( value > max ) value = max;
        return value;
    },
    spsa: ( acc, array, count, values, iterations ) => {
        const deltas = Array( 6 ), high = Array( 6 ), low = Array( 6 );
        let best = null, bestLoss = Infinity;
        for( let k = 0; k < iterations; k++ ) {
            const ck = count / Math.pow( k + 1, kumo_filter.gamma );
            for( let i = 0; i < 6; i++ ) {
                deltas[ i ] = Math.random() > 0.5 ? 1 : -1;
                high[ i ] = values[ i ] + ck * deltas[ i ];
                low[ i ] = values[ i ] - ck * deltas[ i ];
            }
            const diff = kumo_filter.loss( high ) - kumo_filter.loss( low );
            for( let i = 0; i < 6; i++ ) values[ i ] = kumo_filter.fix( values[ i ] - ( array[ i ] / Math.pow( acc + k + 1, kumo_filter.alpha ) ) * ( diff / ( 2 * ck ) * deltas[ i ] ), i );
            const loss = kumo_filter.loss( values );
            if( loss < bestLoss ) {
                best = values.slice( 0 );
                bestLoss = loss;
            }
        }
        return { values: best, loss: bestLoss };
    },
    loss: filters => {
        let color = { red: 0, green: 0, blue: 0 };
        color = kumo_filter.invert( color.red, color.green, color.blue, filters[ 0 ] / 100 );
        color = kumo_filter.sepia( color.red, color.green, color.blue, filters[ 1 ] / 100 );
        color = kumo_filter.saturate( color.red, color.green, color.blue, filters[ 2 ] / 100 );
        color = kumo_filter.hueRotate( color.red, color.green, color.blue, filters[ 3 ] * 3.6 );
        color = kumo_filter.brightness( color.red, color.green, color.blue, filters[ 4 ] / 100 );
        color = kumo_filter.contrast( color.red, color.green, color.blue, filters[ 5 ] / 100 );
        const colorHSL = kumo_filter.hsl( color.red, color.green, color.blue );
        return (
            Math.abs( color.red - kumo_filter.target.red ) +
            Math.abs( color.green - kumo_filter.target.green ) +
            Math.abs( color.blue - kumo_filter.target.blue ) +
            Math.abs( colorHSL.h - kumo_filter.targetHSL.h ) +
            Math.abs( colorHSL.s - kumo_filter.targetHSL.s ) +
            Math.abs( colorHSL.l - kumo_filter.targetHSL.l )
        );
    },
    invert: ( red, green, blue, value=1 ) => ( {
        red: kumo_filter.clamp( ( value + red / 255 * ( 1 - 2 * value ) ) * 255 ),
        green: kumo_filter.clamp( ( value + green / 255 * ( 1 - 2 * value ) ) * 255 ),
        blue: kumo_filter.clamp( ( value + blue / 255 * ( 1 - 2 * value ) ) * 255 )
    } ),
    linear: ( red, green, blue, slope=1, intercept=0 ) => ( {
        red: kumo_filter.clamp( red * slope + intercept * 255 ),
        green: kumo_filter.clamp( green * slope + intercept * 255 ),
        blue: kumo_filter.clamp( blue * slope + intercept * 255 )
    } ),
    sepia: ( red, green, blue, value=1 ) => kumo_filter.multiply( red, green, blue, [
        0.393 + 0.607 * ( 1 - value ),
        0.769 - 0.769 * ( 1 - value ),
        0.189 - 0.189 * ( 1 - value ),
        0.349 - 0.349 * ( 1 - value ),
        0.686 + 0.314 * ( 1 - value ),
        0.168 - 0.168 * ( 1 - value ),
        0.272 - 0.272 * ( 1 - value ),
        0.534 - 0.534 * ( 1 - value ),
        0.131 + 0.869 * ( 1 - value )
    ] ),
    saturate: ( red, green, blue, value=1 ) => kumo_filter.multiply( red, green, blue, [
        0.213 + 0.787 * value,
        0.715 - 0.715 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 + 0.285 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 - 0.715 * value,
        0.072 + 0.928 * value
    ] ),
    hueRotate: ( red, green, blue, angle=0 ) => {
        angle = angle / 180 * Math.PI;
        const sin = Math.sin( angle ), cos = Math.cos( angle );
        return kumo_filter.multiply( red, green, blue, [
            0.213 + cos * 0.787 - sin * 0.213,
            0.715 - cos * 0.715 - sin * 0.715,
            0.072 - cos * 0.072 + sin * 0.928,
            0.213 - cos * 0.213 + sin * 0.143,
            0.715 + cos * 0.285 + sin * 0.140,
            0.072 - cos * 0.072 - sin * 0.283,
            0.213 - cos * 0.213 - sin * 0.787,
            0.715 - cos * 0.715 + sin * 0.715,
            0.072 + cos * 0.928 + sin * 0.072
        ] );
    },
    multiply: ( red, green, blue, matrix ) => ( {
        red: kumo_filter.clamp( red * matrix[ 0 ] + green * matrix[ 1 ] + blue * matrix[ 2 ] ),
        green: kumo_filter.clamp( red * matrix[ 3 ] + green * matrix[ 4 ] + blue * matrix[ 5 ] ),
        blue: kumo_filter.clamp( red * matrix[ 6 ] + green * matrix[ 7 ] + blue * matrix[ 8 ] )
    } ),
    hsl: ( red, green, blue ) => {
        const r = red / 255, g = green / 255, b = blue / 255;
        const min = Math.min( r, g, b ), max = Math.max( r, g, b );
        let h, s, l = ( max + min ) / 2;
        if( max === min ) h = s = 0;
        else {
            const diff = max - min;
            s = l > 0.5 ? diff / ( 2 - max - min ) : diff / ( max + min );
            switch( max ) {
                case r:
                    h = ( g - b ) / diff + ( g < b ? 6 : 0 );
                    break;
                case g:
                    h = ( b - r ) / diff + 2;
                    break;
                case b:
                    h = ( r - g ) / diff + 4;
                    break;
            }
            h /= 6;
        }
        return { h: h * 100, s: s * 100, l: l * 100 };
    },
    brightness: ( red, green, blue, value=1 ) => kumo_filter.linear( red, green, blue, value ),
    contrast: ( red, green, blue, value=1 ) => kumo_filter.linear( red, green, blue, value, - ( 0.5 * value ) + 0.5 ),
    fmt: ( filters, id, multiplier=1 ) => Math.round( filters[ id ] * multiplier ),
    css: filters => `invert(${ kumo_filter.fmt( filters, 0 ) }%) sepia(${ kumo_filter.fmt( filters, 1 ) }%) saturate(${ kumo_filter.fmt( filters, 2 ) }%) hue-rotate(${ kumo_filter.fmt( filters, 3, 3.6 ) }deg) brightness(${ kumo_filter.fmt( filters, 4 ) }%) contrast(${ kumo_filter.fmt( filters, 5 ) }%)`,
    toHex: ( red, green, blue ) => "#" + [ red, green, blue ].map( x => x.toString( 16 ) ).join( '' ).toUpperCase(),
    getDominant: image_element => {
        let blockSize = 5,
            rgb = { r: 0, g: 0, b: 0 },
            canvas = document.createElement( 'canvas' ),
            context = canvas.getContext && canvas.getContext( '2d' ),
            data, width, height, length,
            i = -4,
            count = 0;
        if(
            image_element.tagName !== 'IMG' ||
            ! context
        ) return rgb;
        // if( image_element.crossOrigin !== 'anonymous' ) {
        //     console.error( "Can't get image data due to cross-origin." );
        //     return rgb;
        // }
        height = canvas.height = image_element.naturalHeight || image_element.offsetHeight || image_element.height;
        width = canvas.width = image_element.naturalWidth || image_element.offsetWidth || image_element.width;
        context.drawImage( image_element, 0, 0 );
        try {
            data = context.getImageData( 0, 0, width, height );
        } catch( e ) {
            return rgb;
        }
        length = data.data.length;
        while( ( i += blockSize * 4 ) < length ) {
            ++count;
            rgb.r += data.data[ i ];
            rgb.g += data.data[ i + 1 ];
            rgb.b += data.data[ i + 2 ];
        }
        rgb.r = ~~( rgb.r / count );
        rgb.g = ~~( rgb.g / count );
        rgb.b = ~~( rgb.b / count );
        return rgb;
    }
};
