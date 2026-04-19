import { IsEmail, IsLatitude, IsLongitude } from 'class-validator';

export class ReverseGeocodeDto {

  // "declare" tells TypeScript: “This variable/property exists, but don’t check how or where it’s initialized.”
  @IsLatitude()
  declare lat: string;

  @IsLongitude()
  declare lng: string;
}