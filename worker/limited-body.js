export async function limitRequestBody(request, limit) {
  if(Number(request.headers.get('content-length'))>limit)throw new Error('Request too large');
  const reader=request.body?.getReader();
  if(!reader)return request;
  const chunks=[];let size=0;
  while(true){
    const {done,value}=await reader.read();if(done)break;
    size+=value.byteLength;
    if(size>limit){await reader.cancel();throw new Error('Request too large');}
    chunks.push(value);
  }
  // Blob avoids making an additional contiguous copy before the multipart parser.
  return new Request(request.url,{method:request.method,headers:request.headers,body:new Blob(chunks)});
}
