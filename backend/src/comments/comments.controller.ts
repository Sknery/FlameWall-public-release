import { Controller, Post, Body, Param, UseGuards, Request, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';


@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }


  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  @ApiBearerAuth()
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    const dtoWithPostId = { ...createCommentDto, postId };
    return this.commentsService.create(dtoWithPostId, req.user);
  }


  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  @ApiBearerAuth()
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCommentDto: UpdateCommentDto, @Request() req) {
    return this.commentsService.update(id, updateCommentDto, req.user as User);
  }


  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  @ApiBearerAuth()
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commentsService.remove(id, req.user as User);
  }
}
