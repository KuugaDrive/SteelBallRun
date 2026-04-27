'use client';

import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';

import demo1 from '../../assets/Demo/demo1.svg';
import demo2 from '../../assets/Demo/demo2.svg';
import demo3 from '../../assets/Demo/demo3.svg';

const images = [demo1, demo2, demo3];

export function Demo() {
    const plugin = React.useRef(
        Autoplay({
            delay: 2500,
            stopOnInteraction: true,
        }),
    );

    return (
        <Carousel
            plugins={[plugin.current]}
            opts={{
                align: 'center',
                loop: true,
            }}
            className="w-full max-w-lg"
        >
            <CarouselContent>
                {images.map((imageSrc, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <img src={imageSrc} alt={`Demo ${index + 1}`} className="w-full rounded-lg" />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
