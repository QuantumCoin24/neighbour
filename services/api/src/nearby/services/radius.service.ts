import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class NearbyRadiusService {
  private readonly supportedRadiusKm = [0.5, 1.6, 4.8, 8, 16, 40, 100] as const;

  normalize(radiusKm: number): number {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new BadRequestException('Nearby radius must be a positive number.');
    }

    return Math.min(Math.max(radiusKm, 0.1), 100);
  }

  getPresets() {
    return [
      {
        label: '500 m',
        radiusKm: 0.5,
      },
      {
        label: '1 mile',
        radiusKm: 1.6,
      },
      {
        label: '3 miles',
        radiusKm: 4.8,
      },
      {
        label: '5 miles',
        radiusKm: 8,
      },
      {
        label: '10 miles',
        radiusKm: 16,
      },
      {
        label: '25 miles',
        radiusKm: 40,
      },
      {
        label: 'Entire city',
        radiusKm: 100,
      },
    ];
  }

  isSupportedPreset(radiusKm: number): boolean {
    return this.supportedRadiusKm.some((preset) => Math.abs(preset - radiusKm) < 0.001);
  }
}
