import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET) as string,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // The payload contains the user record since auth.service signed safeUser
    // Returning payload will attach it to request.user
    return payload;
  }
}