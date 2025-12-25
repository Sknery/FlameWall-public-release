
import { Controller, Post, Body, Param, ParseIntPipe, UseGuards, Request, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ClansService } from './clans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateClanRoleDto } from './dto/create-clan-role.dto';
import { UpdateClanRoleDto } from './dto/update-clan-role.dto';


@ApiTags('Clans / Roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('clans/:clanId/roles')
export class ClanRolesController {
    constructor(private readonly clansService: ClansService) { }


    @Post()
    @ApiOperation({ summary: 'Create a new role in a clan' })
    createRole(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Body() createClanRoleDto: CreateClanRoleDto,
        @Request() req,
    ) {
        const userId = req.user.userId;
        return this.clansService.createRole(clanId, userId, createClanRoleDto);
    }


    @Patch(':roleId')
    @ApiOperation({ summary: 'Update a role in a clan' })
    updateRole(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body() updateClanRoleDto: UpdateClanRoleDto,
        @Request() req,
    ) {
        const userId = req.user.userId;
        return this.clansService.updateRole(clanId, roleId, userId, updateClanRoleDto);
    }


    @Delete(':roleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a role from a clan' })
    deleteRole(
        @Param('clanId', ParseIntPipe) clanId: number,
        @Param('roleId', ParseIntPipe) roleId: number,
        @Request() req,
    ) {
        const userId = req.user.userId;
        return this.clansService.deleteRole(clanId, roleId, userId);
    }
}
