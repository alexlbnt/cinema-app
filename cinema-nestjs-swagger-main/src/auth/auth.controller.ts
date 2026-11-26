import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { UsuarioAtual } from './usuario-atual.decorator';
import type { UsuarioAutenticado } from './papel';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Cadastrar novo usuário como CLIENTE (público)' })
  @ApiBody({ type: RegisterDto })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.nome, body.email, body.senha);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login e obter JWT (público)' })
  @ApiBody({ type: LoginDto })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Envia por e-mail o link para redefinir a senha (público)',
  })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Define uma nova senha usando o token do link (público)',
  })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.novaSenha);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retorna dados do usuário autenticado (requer JWT)',
  })
  getMe(@UsuarioAtual() user: UsuarioAutenticado) {
    return this.authService.getMe(user.sub);
  }
}
