import {
  AttackEvent,
  BeatenOffEvent,
  DealCardsEvent,
  DefenceEvent,
  InitDeckEvent,
  ReverseAttackEvent,
  TakeDoneEvent,
  TakeEvent,
  Event, WinEvent,
} from './Events';

const eventsMap = {
  AttackEvent,
  BeatenOffEvent,
  DealCardsEvent,
  DefenceEvent,
  InitDeckEvent,
  ReverseAttackEvent,
  TakeDoneEvent,
  TakeEvent,
  WinEvent,
};

export namespace EventsMapper {

  export type SavedEvent<T extends SavedEvent.Type> = SavedEvent.Data<T> & {
    type: T;
  };

  export type SavedEventUnion = {[X in SavedEvent.Type]: SavedEvent<X>}[SavedEvent.Type];

  export type SavedEvents = Array<SavedEventUnion>;

  export namespace SavedEvent {
    export type Type = keyof typeof eventsMap;
    export type Data<T extends Type> = Omit<InstanceType<typeof eventsMap[T]>, ''>;
  }
}

export class EventsMapper {

  public static mapEvent(event: Event): EventsMapper.SavedEventUnion {
    if (event instanceof AttackEvent)
      return { type: 'AttackEvent', ...event };
    if (event instanceof BeatenOffEvent)
      return { type: 'BeatenOffEvent', ...event };
    if (event instanceof DealCardsEvent)
      return { type: 'DealCardsEvent', ...event };
    if (event instanceof DefenceEvent)
      return { type: 'DefenceEvent', ...event };
    if (event instanceof InitDeckEvent)
      return { type: 'InitDeckEvent', ...event };
    if (event instanceof ReverseAttackEvent)
      return { type: 'ReverseAttackEvent', ...event };
    if (event instanceof TakeDoneEvent)
      return { type: 'TakeDoneEvent', ...event };
    if (event instanceof TakeEvent)
      return { type: 'TakeEvent', ...event };
    if (event instanceof WinEvent)
      return { type: 'WinEvent', ...event };

    throw new Error();
  }

  public static mapSavedEvent(savedEvent: EventsMapper.SavedEventUnion) {
    switch (savedEvent.type) {
      case 'AttackEvent':        return new AttackEvent        (savedEvent.playerIndex, savedEvent.card);  
      case 'BeatenOffEvent':     return new BeatenOffEvent     ();
      case 'DealCardsEvent':     return new DealCardsEvent     (savedEvent.playerIndex, savedEvent.cardsAmount);
      case 'DefenceEvent':       return new DefenceEvent       (savedEvent.playerIndex, savedEvent.card, savedEvent.place);
      case 'InitDeckEvent':      return new InitDeckEvent      (savedEvent.deck);
      case 'ReverseAttackEvent': return new ReverseAttackEvent (savedEvent.playerIndex, savedEvent.card);
      case 'TakeDoneEvent':      return new TakeDoneEvent      ();
      case 'TakeEvent':          return new TakeEvent          ();
      case 'WinEvent':           return new WinEvent           (savedEvent.playerIndex);
    }
    throw new Error();
  }
}
