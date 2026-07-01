export interface Scan {
  _id: string;

  userId: string;

  barcode: string;

  name: string;

  price: number;

  quantity: number;

  description: string;

  addedby: string;

  createAt: string;

  updateAt: string;
}

export interface createScanDto {
  barcode: string;

  name: string;

  bprice: number;

  sprice: number;

  quantity: number;

  description: string;

  addedby: string;
}
