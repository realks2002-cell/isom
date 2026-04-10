import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '인테리어 시뮬레이터',
    short_name: '인테리어 시뮬',
    description: 'CAD 평면도를 이소메트릭 3D로 변환하고 마감재를 시뮬레이션',
    start_url: '/dashboard?source=pwa',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fafafa',
    theme_color: '#171717',
    lang: 'ko',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
