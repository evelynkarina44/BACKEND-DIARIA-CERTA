import { normalizeMedia, normalizeImage, MAX_IMAGE, attachmentSelect, presentAttachment } from '../media/attachmentMedia.js';
import prisma from '../../lib/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../errors/index.js';
export const MAX_REPORT_IMAGE = MAX_IMAGE;
export async function normalizeReportImage(input) {
 return normalizeImage(input);
}
export class DenunciaAttachmentService {
 constructor(database=prisma){this.database=database;}
 async upload(id,input,auth,key){
  const media=await normalizeMedia(input);
  return this.database.$transaction(async tx=>{
   const report=await tx.denuncia.findUnique({where:{id_denuncia:Number(id)}});
   if(!report)throw new NotFoundError('Denúncia não encontrada.');
   if(report.id_usuario_denunciante!==auth?.id_usuario)throw new ForbiddenError('Não é possível anexar a esta denúncia.');
   if(key){const previous=await tx.denuncia_anexo.findFirst({where:{id_denuncia:Number(id),chave_cliente:key},select:attachmentSelect});if(previous)return previous;}
   if(report.status!=='Pendente')throw new ConflictError('Denúncia em análise não aceita novos anexos.');
   const lock=await tx.denuncia.updateMany({where:{id_denuncia:Number(id),versao:report.versao,status:'Pendente'},data:{versao:{increment:1}}});
   if(!lock.count)throw new ConflictError('Denúncia alterada. Atualize antes de anexar.');
   if(key){const previous=await tx.denuncia_anexo.findFirst({where:{id_denuncia:Number(id),chave_cliente:key},select:attachmentSelect});if(previous)return previous;}
   if(await tx.denuncia_anexo.count({where:{id_denuncia:Number(id)}})>=3)throw new BadRequestError('São permitidos até 3 anexos por denúncia.');
   return tx.denuncia_anexo.create({data:{id_denuncia:Number(id),...media,...(key?{chave_cliente:key}:{})},select:attachmentSelect});
  });
 }
 async read(id,id_anexo,auth){
  const report=await this.database.denuncia.findUnique({where:{id_denuncia:Number(id)},select:{id_usuario_denunciante:true}});
  if(!report)throw new NotFoundError('Denúncia não encontrada.');
  const admin=auth?.activeProfile==='ADMIN'&&auth.profiles?.includes('ADMIN');
  if(!admin&&report.id_usuario_denunciante!==auth?.id_usuario)throw new ForbiddenError('Imagem restrita ao denunciante e à administração.');
  const image=await this.database.denuncia_anexo.findFirst({where:{id_anexo,id_denuncia:Number(id)}});
  if(!image)throw new NotFoundError('Imagem não encontrada.');
  return presentAttachment(image);
 }
}
