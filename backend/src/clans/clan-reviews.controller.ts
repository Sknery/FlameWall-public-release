
import { Controller, Post, Body, Param, ParseIntPipe, UseGuards, Request, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClansService } from './clans.service';
import { CreateClanReviewDto } from './dto/create-clan-review.dto';


@ApiTags('Clans / Reviews')
@Controller('clans/:clanId/reviews')
export class ClanReviewsController {
    constructor(private readonly clansService: ClansService) { }


    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Leave a review for a clan' })
    createReview(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Body() createReviewDto: CreateClanReviewDto,
        @Request() req,
    ) {
        return this.clansService.createClanReview(clanId, req.user.userId, createReviewDto);
    }


    @Get()
    @ApiOperation({ summary: 'Get all reviews for a clan' })
    getReviews(@Param('clanId', ParseIntPipe) clanId: number) {
        return this.clansService.getClanReviews(clanId);
    }
}
