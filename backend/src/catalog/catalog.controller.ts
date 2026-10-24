import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('tracks') tracks() {
    return this.catalog.tracks();
  }
  @Get('lessons/:id') lesson(@Param('id') id: string) {
    return this.catalog.publicLesson(id);
  }
  @Get('exercises') exercises() {
    return this.catalog.exercises();
  }
  @Get('projects') projects() {
    return this.catalog.projects();
  }
}
