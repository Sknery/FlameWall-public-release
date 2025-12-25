
import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailerService implements OnModuleInit {
    private readonly logger = new Logger(MailerService.name);
    private fromEmail: string;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');

        if (!apiKey || !fromEmail) {
            this.logger.error('!!! SENDGRID_API_KEY или SENDGRID_FROM_EMAIL не установлены в .env !!!');
            this.logger.error('!!! Сервис рассылки НЕ БУДЕТ работать. !!!');
        } else {
            sgMail.setApiKey(apiKey);
            this.fromEmail = fromEmail;
            this.logger.log('MailerService успешно инициализирован с SendGrid.');
        }
    }

    private async sendMail(to: string, subject: string, html: string) {
        if (!this.fromEmail) {
            this.logger.error(`Не могу отправить письмо "${subject}" на ${to}. Сервис SendGrid не настроен.`);
            throw new InternalServerErrorException('Mail service is not configured correctly.');
        }

        const msg = {
            to: to,
            from: {
                email: this.fromEmail,
                name: 'FlameWall'
            },
            subject: subject,
            html: html,
        };

        try {
            await sgMail.send(msg);
            this.logger.log(`💌 Письмо "${subject}" успешно отправлено на ${to} через SendGrid.`);
        } catch (error) {
            this.logger.error(`Не удалось отправить письмо на ${to}. Ошибка SendGrid:`, error.toString());
            if (error.response) {
                this.logger.error('SendGrid response body:', error.response.body);
            }
            throw new InternalServerErrorException('Failed to send email.');
        }
    }

    async sendVerificationEmail(user: User, token: string) {
        const frontendUrl = (this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173').split(',')[0];
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

        const subject = 'Verify Your Email Address for FlameWall';
        const html = `<div style="font-family: sans-serif; text-align: center; padding: 20px;"><h2>Welcome to FlameWall, ${user.username}!</h2><p>Please click the button below to verify your email address.</p><a href="${verificationUrl}" style="background-color: #FF4D00; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Verify Email</a><p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not create this account, you can safely ignore this email.</p></div>`;

        await this.sendMail(user.email, subject, html);
    }

    async sendEmailChangeVerificationEmail(user: User, newEmail: string, token: string) {
        const frontendUrl = (this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173').split(',')[0];
        const verificationUrl = `${frontendUrl}/verify-email-change?token=${token}`;

        const subject = 'Confirm Your New Email Address for FlameWall';
        const html = `<div style="font-family: sans-serif; text-align: center; padding: 20px;"><h2>Hi ${user.username},</h2><p>You requested to change your email address on FlameWall to this one.</p><p>Please click the button below to confirm this change. This link will expire in 1 hour.</p><a href="${verificationUrl}" style="background-color: #FF4D00; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Confirm New Email</a><p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not request this change, you can safely ignore this email. Your current email address remains unchanged.</p></div>`;

        await this.sendMail(newEmail, subject, html);
    }

    async sendPasswordResetEmail(user: User, token: string) {
        const frontendUrl = (this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173').split(',')[0];
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        const subject = 'Reset Your Password for FlameWall';
        const html = `<div style="font-family: sans-serif; text-align: center; padding: 20px;"><h2>Hi ${user.username},</h2><p>You requested to reset your password for your FlameWall account.</p><p>Please click the button below to reset your password. This link will expire in 1 hour.</p><a href="${resetUrl}" style="background-color: #FF4D00; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Reset Password</a><p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.</p></div>`;

        await this.sendMail(user.email, subject, html);
    }
}