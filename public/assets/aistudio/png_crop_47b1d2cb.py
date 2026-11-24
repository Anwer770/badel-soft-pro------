import zlib, struct, sys
from png_sample import load_png

def save_png(path, w, h, rgb):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ+data)&0xffffffff)
    raw = b''.join(b'\x00' + bytes(rgb[y*w*3:(y+1)*w*3]) for y in range(h))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w,h,8,2,0,0,0)) + chunk(b'IDAT', zlib.compress(raw,6)) + chunk(b'IEND', b'')
    open(path,'wb').write(png)

def crop_scale(img, x0,y0,x1,y1, scale=2):
    w,h,ch,buf = img
    cw, chh = x1-x0, y1-y0
    ow, oh = cw*scale, chh*scale
    out = bytearray(ow*oh*3)
    for y in range(oh):
        sy = y0 + y//scale
        for x in range(ow):
            sx = x0 + x//scale
            o = (sy*w+sx)*ch; d=(y*ow+x)*3
            out[d:d+3] = buf[o:o+3]
    return ow, oh, out

if __name__=='__main__':
    src, dst = sys.argv[1], sys.argv[2]
    x0,y0,x1,y1 = map(int, sys.argv[3:7])
    scale = int(sys.argv[7]) if len(sys.argv)>7 else 2
    img = load_png(src)
    ow,oh,out = crop_scale(img,x0,y0,x1,y1,scale)
    save_png(dst,ow,oh,out)
    print(dst, ow, oh)
