import zlib, struct, sys

def load_png(path):
    d = open(path,'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8; idat = b''; w=h=bd=ct=None
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]
        data = d[pos+8:pos+8+ln]
        if typ == b'IHDR':
            w,h,bd,ct,comp,filt,inter = struct.unpack('>IIBBBBB', data)
            assert bd==8 and inter==0, (bd,inter)
        elif typ == b'IDAT': idat += data
        pos += 12+ln
    raw = zlib.decompress(idat)
    ch = {0:1,2:3,3:1,4:2,6:4}[ct]
    stride = w*ch
    out = bytearray(h*stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p+=1
        line = bytearray(raw[p:p+stride]); p+=stride
        if f==1:
            for i in range(ch,stride): line[i] = (line[i]+line[i-ch])&255
        elif f==2:
            for i in range(stride): line[i] = (line[i]+prev[i])&255
        elif f==3:
            for i in range(stride):
                a = line[i-ch] if i>=ch else 0
                line[i] = (line[i]+((a+prev[i])>>1))&255
        elif f==4:
            for i in range(stride):
                a = line[i-ch] if i>=ch else 0
                b = prev[i]; c = prev[i-ch] if i>=ch else 0
                pa=abs(b-c); pb=abs(a-c); pc=abs(a+b-2*c)
                pr = a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
                line[i] = (line[i]+pr)&255
        out[y*stride:(y+1)*stride] = line
        prev = line
    return w,h,ch,out

def px(img,x,y):
    w,h,ch,buf = img
    o = (y*w+x)*ch
    return tuple(buf[o:o+3])

def hexc(t): return '#%02X%02X%02X' % t

if __name__=='__main__':
    path = sys.argv[1]
    img = load_png(path)
    print('size', img[0], img[1])
    for arg in sys.argv[2:]:
        x,y = map(int,arg.split(','))
        print(f'({x},{y})', hexc(px(img,x,y)))
