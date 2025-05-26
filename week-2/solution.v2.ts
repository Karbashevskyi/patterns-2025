
export interface IPurchase {
    name: string;
    price: number;
}

export class PurchaseIterator {

    private readonly items: IPurchase[] = [];
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
        if (!Array.isArray(items) || !items.length) {
            throw new Error('Items must be non empty array');
        }
        const instance = new PurchaseIterator(items);
        return instance;
    }

}

export class LimitExceededBasketError extends Error {
    public readonly item: IPurchase;
    public constructor(item: IPurchase) {
        super(`'Basket limit exceeded': ${item.name} costs ${item.price}`);
        this.item = item;
    }
    public static create(item: IPurchase): LimitExceededBasketError {
        const instance = new LimitExceededBasketError(item);
        return instance;
    }
}

export class Basket {
    
    private total: number = 0;

    private readonly items: IPurchase[] = [];
    private readonly limit: number = 0;
    private readonly errors: Error[] = [];
    private readonly registerCallback: ((value: any) => void)[] = [];

    public constructor({ limit }: { limit: number }) {
        this.limit = limit;
    }

    public add(item: IPurchase): void {
        if (this.total + item.price > this.limit) {
            const error = LimitExceededBasketError.create(item);
            this.errors.push(error);
        } else {
            this.items.push(item);
            this.total += item.price;
        }
    }

    public end(): void {
        this.registerCallback.forEach(callback => callback({ items: this.items, total: this.total, errors: this.errors }));
        this.registerCallback.length = 0; // Clear callbacks after execution
    }

    public then(resolve: (value: any) => void): void {
        this.registerCallback.push(resolve);
    }

}

const basketNotify = async (basket: Basket) => {
    
    const { items, total, errors } = await basket;

    console.log();
    console.log('basketNotify');
    console.log({
        items,
        total,
        errors,
    });
    console.log();

};

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
  const basket = new Basket({ limit: 1050 });

  basketNotify(basket);
  
  for await (const item of goods) basket.add(item);

  basket.then((result) => {
    console.log('Basket result:', result);
  })

  basket.end();

};

main();
