// Create Iterator for given dataset with Symbol.asyncIterator
// Use for..of to iterate it and pass data to Basket
// Basket is limited to certain amount
// After iteration ended Basket should return Thenable
// to notify us with final list of items, total and
// escalated errors

export interface IPurchase {
    name: string;
    price: number;
}

export interface IPurchaseIteratorItem {
    item: IPurchase;
    hasMore: boolean;
}

export class PurchaseIterator {

    private purchase: IPurchase[] = [];

    public constructor(purchase: IPurchase[]) {
        this.purchase = [...purchase];
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator<IPurchaseIteratorItem, void, unknown> {
        let index = 0;
        for (const item of this.purchase) {
            yield {
                item,
                hasMore: (index < this.purchase.length - 1),
            };
            index++;
        }
    }

    public static create(purchase: IPurchase[]) {
        const instance = new PurchaseIterator(purchase);
        return instance;
    }
  
}

export class Basket {
    private limit = 0;
    private callback: ((items: IPurchase[], total: number) => void) | null = null;
    private items: IPurchase[] = [];
    private total = 0;
    private errors: Error[] = [];

    public constructor({ limit }, callback) {
            this.limit = limit;
            this.callback = callback;
    }

    public add({item, hasMore}: IPurchaseIteratorItem) {
        if (item) {
            if ((this.total + item.price) > this.limit) {
                this.errors.push(new Error(`Limit exceeded: ${this.limit}`));
                return;
            }
            this.total += item.price || 0;
            this.items.push(item);
        } 
        
        if (!hasMore) {
            // console.log({
            //     errors: this.errors,
            //     items: this.items,
            //     total: this.total,
            // })
            this.callback?.(this.items, this.total);
        }
        
    }

    public getErrors() {
        return this.errors;
    }
}

const purchase: IPurchase[] = [
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
        console.log(total);
    });
    for await (const item of goods) {
        basket.add(item);
    }
};

main();