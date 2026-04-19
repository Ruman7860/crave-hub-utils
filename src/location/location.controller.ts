import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { LocationService } from './location.service';
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto';

@Controller('api/location')
export class LocationController {
  constructor(private locationService: LocationService){ }

  @UseGuards(JwtAuthGuard)
  @Get("reverse-geocode")
  reverse(@Query() query: ReverseGeocodeDto){
    return this.locationService.reverseGeocode(query);
  }
}
