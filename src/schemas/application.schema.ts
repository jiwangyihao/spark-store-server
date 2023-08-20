import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// @Prop 装饰器接受一个可选的参数，通过这个，你可以指示这个属性是否是必须的，是否需要默认值，或者是标记它作为一个常量，下面是例子
// SchemaFactory 是 mongoose 内置的一个方法做用是读取模式文档 并创建 Schema 对象
import { Document } from 'mongoose';
export type ApplicationDocument = Application & Document;
@Schema({ strict: false })
export class Application extends Document {
  // 吐了，投递审核的时候不能仔细看看投上来的都是什么吗
  // 只能关严格模式了
  @Prop({ required: true })
  Package: string;
  @Prop({ required: true })
  Version: string;
  @Prop()
  Architecture: string;
  @Prop()
  'Multi-Arch': string;
  @Prop()
  Priority: string;
  @Prop()
  Section: string;
  @Prop()
  Source: string;
  @Prop()
  Maintainer: [string];
  @Prop()
  Depends: string;
  @Prop()
  Recommends: string;
  @Prop()
  Filename: string;
  @Prop()
  Size: number;
  @Prop()
  MD5sum: string;
  @Prop()
  SHA1: string;
  @Prop()
  SHA256: string;
  @Prop()
  SHA512: string;
  @Prop()
  Description: string;
  @Prop()
  'Build-Depends': string;
  @Prop()
  'Standards-Version': string;
  @Prop()
  Sort: [string];
  @Prop()
  Name: string;
  @Prop()
  Author: string;
  @Prop()
  Homepage: string;
  @Prop()
  More: string;
  @Prop()
  Tags: [string];
  @Prop()
  img_urls: [string];
  @Prop()
  icons: string;
  @Prop()
  'Installed-Size': string;
  @Prop()
  Dependency: boolean;
  @Prop()
  History: boolean;
  @Prop()
  Provides: string;
  @Prop()
  Conflicts: string;
  @Prop()
  Replaces: string;
  @Prop()
  Origin: string;
  @Prop()
  License: string;
  @Prop()
  Vendor: string;
  @Prop()
  Date: string;
  @Prop()
  Essential: string;
  @Prop()
  'Auto-Built-Package': string;
  @Prop()
  AutoReqProv: string;
  @Prop()
  Breaks: string;
  @Prop()
  'Build-Ids': string;
  @Prop()
  'Built-Using': string;
  @Prop()
  'Download-Size': string;
  @Prop()
  'Original-Maintainer': string;
  @Prop()
  'Package-Type': string;
  @Prop()
  'Pre-Depends': string;
  @Prop()
  Relocations: string;
  @Prop()
  Suggests: string;
  @Prop()
  Check: string;
  @Prop()
  'Python-Version': string;
  @Prop()
  Severity: string;
  @Prop()
  Type: string;
}
export const ApplicationSchema = SchemaFactory.createForClass(Application);
