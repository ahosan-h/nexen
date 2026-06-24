"use client";
interface cardprop {
  title: string;
  price: number;
  quantity: number;
}
export default function ProductCrad({ title, price, quantity }: cardprop) {
  return (
    <div className="card w-96 bg-indigo-400">
      <div className="card-body">
        <div className="card-title bg-pink-300">{title}</div>
        <p>{price}</p>
        <p>{quantity} </p>
      </div>
    </div>
  );
}
