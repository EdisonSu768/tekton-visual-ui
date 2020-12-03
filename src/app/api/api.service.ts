import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

const token =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlHenpxLVc2c1BlMnk5R2FSX3o5UHViT25jVjRtUURXTHhMUUlldUFiNjAifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImRlZmF1bHQtdG9rZW4tOHQ2cmoiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGVmYXVsdCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImQ1N2IzZDMwLWZlYzAtNGFiOS05Nzk2LTg4MTI3Njk5OGE3ZCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmRlZmF1bHQifQ.Lw767-XBnIm2-C3ZapHZDLK-CH8V5S-6YKj9OH_4pWoJ0R3cM-mGd5XRL1kvCOPpQNCPzbm36ZPy6tBfk11mYfmUO9wlLDa1I6AN1CPFwt58ysyxm9X0MWvA4z_WLGIc_STnN3tBxgg6Rr_Uvzgp09dE4tgG4IQ_eiyiweKgDGUzmbcEuyX3kir-T9RBwQDOexhZZmyucV3ZMGju4WmppswK1wdiabZ2_sBRId3FIp65lu5yh3kTukRaVcK5GDIaiIXvty4TSNv2zBxmqquqYR4G97WkPz10Ug5DZNKBCe03tSUyIrS3wU3xbS3Ds4MLHYHRXPy06bv1OVz_MwYADQ';

@Injectable()
export class ApiService {
  static readonly TEKTON_API = '/apis/tekton.dev/v1beta1';

  constructor(private readonly http: HttpClient) {}

  getTektonPipelineByNamespace(namespace: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(
      `${ApiService.TEKTON_API}/namespaces/${namespace}/pipelines`,
      { headers: headers },
    );
  }
}
