import { Injectable } from '@nestjs/common';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationService {
  async reverseGeocode(query: ReverseGeocodeDto) {
    try {
      const { lat, lng } = query;

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            // Just type a descriptive string here. No account required!
            'User-Agent': 'CraveHub-App-Development'
          },
        }
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Reverse geocode failed: ${errorText}`);
      }

      const data = await res.json();

      return {
        address: data.display_name || 'Unknown Address',
        city: data.address.city || data.address.town || data.address.village || "Unknown City"
      };
    } catch (error) {
      console.error("Error while Reversing Location -> ", error);
      throw error;
    }
  }
}
