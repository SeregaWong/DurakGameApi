import {DurakPlayerApi} from './DurakPlayerApi';
import {shuffle} from './shuffle';
import {Card, CardSuit, CardValue} from './type';

export namespace DurakGame {

    export interface Table {
        attackCards: Card[];
        defenceCards: Card[];
    }

    export namespace Actions {

        export interface Attack {
            type: 'attack';
            card: Card;
        }

        export interface Done {
            type: 'done';
        }

        export interface Take {
            type: 'take';
        }

        export interface Defence {
            type: 'defence';
            card: Card;
            /**
             * @type int
             * @range [0, 5]
             */
            place: number;
        }

    }

    export type Action =
        Actions.Attack
        | Actions.Take
        | Actions.Defence
        | Actions.Done;

    export type ActionType = Action['type'];

    export type ActionByType<T extends ActionType> = Extract<Action, {type: T}>;

    export type ActionHandler<T extends ActionType = ActionType> =
        (
            game: DurakGame,
            player: DurakPlayerApi,
            action: ActionByType<T>,
        ) => void;

    export type WinHandler = (winner?: DurakPlayerApi) => void;

    export interface CommonGameState {
        table: Table;
        outGameCards: Card[];
        trumpCard: Card;
        deckCardsLeftAmount: number;
        wasTaken: boolean;
        action?: Action;
    }

    export interface PersonalGameState extends CommonGameState {
        myCards: Card[];
        enemyCardsAmount: number;
        isAttack: boolean;
    }

}

export class DurakGame {

    private readonly deck = DurakGame.getCardsDeck();
    private readonly trumpCard = this.deck[0];
    private readonly trumpCardSuit = this.trumpCard.suit;

    private readonly outGameCards: Card[] = [];

    private attackPlayer!: DurakPlayerApi;

    private table: DurakGame.Table = {attackCards: [], defenceCards: []};

    private player1Cards: Card[] = [];
    private player2Cards: Card[] = [];

    private step = 0;

    private wasTaken = false;

    private get maxAttackCardsAmountNow() {
        return this.step === 1 ? 5 : 6;
    }

    private get defencePlayer() {
        const {attackPlayer, player1} = this;

        if (attackPlayer !== player1) {
            return player1;
        } else {
            return this.player2;
        }
    }

    private get defenceCardsAmount() {
        return this.table.defenceCards
            .reduce((amount, card) => !card ? amount : amount + 1, 0);
    }

    private get allTableCards() {
        const {table} = this;

        return [
            table.attackCards,
            table.defenceCards,
        ].flat();
    }

    private static actionHandlersMap: {
        [P in DurakGame.ActionType]: DurakGame.ActionHandler<P>;
    } = {
        attack(game, player, {card}) {
            if (player === game.attackPlayer) {
                const {table: {attackCards}, maxAttackCardsAmountNow} = game;

                if (attackCards.length > maxAttackCardsAmountNow) {
                    throw new Error('limit attack');
                }

                if (!!attackCards.length) {
                    const isSameValCardOnTable = game.allTableCards
                        .some(({val}) => card.val === val);

                    if (!isSameValCardOnTable) {
                        throw new Error('can only put card same by val');
                    }
                }

                const isDefencePlayerHaveNoCards =
                    (
                        attackCards.length
                        - game.defenceCardsAmount
                        - game.getPlayerCards(game.defencePlayer).length
                    ) === 0;

                if (isDefencePlayerHaveNoCards) {
                    throw new Error('defence player have no cards');
                }

                attackCards.push(card);
                game.takeAwayCard(player, card);
            } else {
                const {table: {attackCards}} = game;
                if (!attackCards.length || !!game.defenceCardsAmount) {
                    throw new Error('cannot transfer back that table');
                }
                if (card.val !== attackCards[0].val) {
                    throw new Error('card must have same val');
                }

                const isAttackPlayerHaveNoCards =
                        attackCards.length >= game.getPlayerCards(game.attackPlayer).length;

                if (isAttackPlayerHaveNoCards) {
                    throw new Error('attack player have no cards');
                }

                attackCards.push(card);
                game.takeAwayCard(player, card);
                game.reverseAttackPlayer();
            }
        },
        defence(game, player, {card, place}) {
            if (player === game.attackPlayer || game.wasTaken) {
                throw new Error('cannot defence');
            }
            const attackCard = game.table.attackCards[place];

            if (!attackCard || !!game.table.defenceCards[place]) {
                throw new Error('wrong place');
            }

            const {trumpCardSuit} = game;

            if (card.suit !== trumpCardSuit || attackCard.suit === trumpCardSuit) {

                if (card.suit !== attackCard.suit) {
                    throw new Error('cannot defence that card: wrong suit');
                }

                if (card.val < attackCard.val) {
                    throw new Error('cannot defence that card: wrong val');
                }

            }

            game.takeAwayCard(player, card);
            game.table.defenceCards[place] = card;


            if (
                game.defenceCardsAmount === game.maxAttackCardsAmountNow
                ||
                !game.getPlayerCards(game.attackPlayer).length
                ||
                !game.getPlayerCards(game.defencePlayer).length
                ) {
                this.done(game, player, {type: 'done'});
            }
        },
        done(game, player) {

            if (player !== game.attackPlayer) {

                if (
                    !!game.getPlayerCards(game.attackPlayer).length
                    &&
                    !!game.getPlayerCards(game.defencePlayer).length
                ) {
                    throw new Error('cannot done');
                }
            } else {

                if (!game.table.attackCards.length) {
                    throw new Error('cannot done');
                }

            }

            if (game.table.attackCards.length !== game.defenceCardsAmount) {
                throw new Error('cannot done');
            }

            game.toStep();
        },
        take(game, player) {
            if (player === game.attackPlayer) {
                throw new Error('cannot take');
            }
            game.wasTaken = true;
        },
    };

    constructor(
        private readonly player1: DurakPlayerApi,
        private readonly player2: DurakPlayerApi,
        private readonly onWin: DurakGame.WinHandler,
    ) {

        player1.setGame(this);
        player2.setGame(this);

        this.toStep();
        this.onUpdate();
    }

    public update(player: DurakPlayerApi, action: DurakGame.Action) {
        if (player !== this.player1 && player !== this.player2) {
            throw new Error('wrong player');
        }

        const actionHandler = DurakGame.actionHandlersMap[action.type] as DurakGame.ActionHandler; // fix ts

        actionHandler(this, player, action);

        this.onUpdate(action);
    }

    private clearTable() {
        const {table} = this;

        table.attackCards = [];
        table.defenceCards = [];
    }

    private toStep() {
        this.step++;

        if (this.wasTaken) {
            this.wasTaken = false;
            this.addPlayerCards(this.defencePlayer, this.allTableCards);
        } else {
            this.reverseAttackPlayer();
            this.outGameCards.push(...this.allTableCards);
        }

        this.clearTable();
        this.dealСards();

        if (!this.player1Cards.length) {
            if (!this.player2Cards.length) {
                this.onWin();
            } else {
                this.onWin(this.player1);
            }
        } else if (!this.player2Cards.length) {
            this.onWin(this.player2);
        }
    }

    private onUpdate(action?: DurakGame.Action) {
        const commonState: DurakGame.CommonGameState = {
            outGameCards: this.outGameCards,
            table: this.table,
            trumpCard: this.trumpCard,
            deckCardsLeftAmount: this.deck.length,
            wasTaken: this.wasTaken,
            action,
        };
        const {
            player1,
            player2,
            player1Cards,
            player2Cards,
        } = this;

        const is1stAttack = player1 === this.attackPlayer;

        player1.onUpdate({
            ...commonState,
            myCards: player1Cards,
            enemyCardsAmount: player2Cards.length,
            isAttack: is1stAttack,
        });

        player2.onUpdate({
            ...commonState,
            myCards: player2Cards,
            enemyCardsAmount: player1Cards.length,
            isAttack: !is1stAttack,
        });
    }

    private reverseAttackPlayer() {
        this.attackPlayer = this.defencePlayer;
    }

    private getPlayerCards(player: DurakPlayerApi) {
        if (player === this.player1) {
            return this.player1Cards;
        } else {
            return this.player2Cards;
        }
    }

    private setPlayerCards(player: DurakPlayerApi, cards: Card[]) {
        if (player === this.player1) {
            this.player1Cards = cards;
        } else {
            this.player2Cards = cards;
        }
    }

    private addPlayerCards(player: DurakPlayerApi, cards: Card[]) {
        this.getPlayerCards(player).push(...cards);
    }

    private dealСards() {
        this.dealСardsToPlayer(this.attackPlayer);
        this.dealСardsToPlayer(this.defencePlayer);
    }

    private dealСardsToPlayer(player: DurakPlayerApi) {
        const cards = this.getPlayerCards(player);
        const {deck} = this;

        const needAdd = 6 - cards.length;
        const canAdd = Math.min(needAdd, deck.length);

        if (canAdd < 1) { return; }

        cards.push(...deck.splice(deck.length - canAdd));
    }

    private takeAwayCard(player: DurakPlayerApi, card: Card) {
        const playerCards = this.getPlayerCards(player);

        const newCards = playerCards
            .filter(({suit, val}) => !(card.suit === suit && card.val === val));

        if (newCards.length !== playerCards.length - 1) {
            throw new Error('have no card');
        }

        this.setPlayerCards(player, newCards);
    }

    private static getCardsDeck() {
        const deck: Card[] = [];

        for (let suit: CardSuit = 0; suit < 4; suit++) {
            for (let val: CardValue = 0; val < 6; val++) {
                deck.push({suit, val});
            }
        }

        return shuffle(deck);
    }
}
