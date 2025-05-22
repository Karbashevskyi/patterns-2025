
export interface IPurchase {
    name: string;
    price: number;
}

export class PurchaseIterator {

    private readonly items: IPurchase[];
    public constructor(
        items: IPurchase[]
    ) {
        this.items = items;
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator<IPurchase, void, unknown> {
        for (const item of this.items) {
            yield item;
        }
    }

    public static create(items: IPurchase[]): PurchaseIterator {
        return new PurchaseIterator(items);
    }

}

export class Basket {

    private items: IPurchase[] = [];
    private total: number = 0;
    private errors: Error[] = [];
    private limit: number = 0;
    private onDone: (items: IPurchase[], total: number) => void = (() => {});

    public constructor({ limit }: { limit: number }, onDone?: (items: IPurchase[], total: number) => void) {
        this.limit = limit;
        this.onDone = onDone ?? this.onDone;
    }

    public add(item: IPurchase): void {
        if (this.total + item.price > this.limit) {
            this.errors.push(new Error(`Limit exceeded: ${this.limit}`));
        } else {
            this.items.push(item);
            this.total += item.price;
        }
    }

    public getErrors(): Error[] {
        return this.errors;
    }

    public then(resolve: (value: any) => void): void {
        this.onDone(this.items, this.total);
        resolve({ items: this.items, total: this.total });
    }

}

const purchase = [
  { name: 'Laptop',  price: 1500 },
  { name: 'Mouse',  price: 25 },
  { name: 'Keyboard',  price: 100 },
  { name: 'HDMI cable',  price: 10 },
  { name: 'Bag', price: 50 },
  { name: 'Mouse pad', price: 5 },
];

const main = async () => {
  const goods = PurchaseIterator.create(purchase);
  const basket = new Basket({ limit: 1050 }, (items, total) => {
    console.log('Total:', total);
  });
  for await (const item of goods) {
    basket.add(item);
  }
  await basket;
};

main();
