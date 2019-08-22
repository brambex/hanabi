import React, { useState, useEffect } from "react";
import Card, { CardContext, PositionMap } from "./card";
import Vignettes from "./vignettes";
import DiscardPile from "./discardPile";
import { useRouter } from "next/router";
import IGameState, { IHintAction, ICard, IPlayer } from "../game/state";
import { isGameOver } from "../game/actions";
import { actionToText } from "../game/utils";
import Button from "./button";

interface IActionArea {
  game: IGameState;
  selectedArea:
    | IPlayerSelectedArea
    | IOwnGameSelectedArea
    | IDiscardSelectedArea;
  player: IPlayer;
  onCommitAction: any;
}

interface IPlayerSelectedArea {
  type: ActionAreaType.PLAYER;
  player: IPlayer;
  cardIndex?: number;
}

interface IOwnGameSelectedArea {
  type: ActionAreaType.OWNGAME;
  player: IPlayer;
  cardIndex?: number;
}

interface IDiscardSelectedArea {
  type: ActionAreaType.DISCARD;
}

export enum ActionAreaType {
  PLAYER = "player",
  OWNGAME = "ownGame",
  DISCARD = "discard"
}

const colors = ["red", "yellow", "green", "blue", "white"];
const values = [1, 2, 3, 4, 5];

export default ({
  game,
  selectedArea,
  player,
  onCommitAction
}: IActionArea) => {
  const router = useRouter();
  const { playerId } = router.query;

  const [pendingHint, setPendingHint] = useState({
    type: null,
    value: null
  } as IHintAction);
  const [selectedCard, selectCard] = useState(null);

  useEffect(
    () =>
      selectCard(
        selectedArea && selectedArea.type !== ActionAreaType.DISCARD
          ? selectedArea.cardIndex
          : null
      ),
    [selectedArea]
  );

  const currentPlayer = game.players[game.currentPlayer];
  const isCurrentPlayer = currentPlayer === player;

  if (isGameOver(game)) {
    return (
      <div className="ph2 bg-grey bt bg-gray-light b--gray-light pt4 flex-grow-1 f6 f4-l fw2 tracked ttu gray">
        <p>The game is over! Your score is {game.playedCards.length} 🎉</p>
      </div>
    );
  }

  if (!selectedArea) {
    return (
      <div className="ph2 pt2 ph4-l pt4-l bg-grey bt bg-gray-light b--gray-light flex-grow-1 f6 f4-l fw2 gray lh-copy">
        {!isCurrentPlayer && (
          <div className="ttu tracked">It's {currentPlayer.name}'s turn</div>
        )}
        {isCurrentPlayer && (
          <div className="ttu tracked">
            <div>Your turn!</div>
            <div>- Give a hint by tapping on your playmates' hand</div>
            <div>- Play or discard by tapping on your own game</div>
          </div>
        )}
        <hr />
        <div className="ttu tracked">Last actions:</div>
        {game.actionsHistory
          .slice(-5)
          .reverse()
          .map((action, i) => {
            const playerName =
              action.from === player.index
                ? "You"
                : game.players[action.from].name;

            return (
              <div key={i}>
                - {playerName} {actionToText(action, game)}
              </div>
            );
          })}
      </div>
    );
  }

  if (selectedArea.type === ActionAreaType.DISCARD) {
    return (
      <div className="pa2 pa4-l bg-gray-light bt b--gray-light flex flex-column flex-grow-1">
        <div className="flex flex-row pb1 pb2-l f6 f4-l fw2 tracked ttu ml1 gray">
          Discarded cards
        </div>
        <DiscardPile cards={game.discardPile} />
      </div>
    );
  }

  if (selectedArea.type === ActionAreaType.PLAYER) {
    const { player } = selectedArea;

    return (
      <div className="pa2 pa4-l bg-gray-light bt b--gray-light flex flex-column flex-grow-1">
        <div className="flex flex-row pb1 pb2-l f6 f4-l fw2 tracked ttu ml1 gray mb2">
          {player.name}'s game
        </div>
        <div className="flex flex-row pb2">
          {player.hand.map((card, i) => (
            <Card
              key={i}
              card={card}
              hidden={player.id === playerId}
              position={i}
              size="large"
              context={CardContext.TARGETED_PLAYER}
              className="ma1"
              selected={isCardHintable(pendingHint, card)}
            />
          ))}
        </div>
        {isCurrentPlayer && (
          <>
            <div className="flex flex-row pb1 pb2-l f6 f4-l fw2 tracked ttu ml1 mb2 gray mt3">
              Select a hint below
            </div>
            <div className="flex flex-row pb2 ml1">
              <Vignettes
                colors={colors}
                values={values}
                onSelect={action => setPendingHint(action)}
                pendingHint={pendingHint}
              />
              <div className="pl3">
                <div className="h2 f5 fw3 i dark-gray">
                  {textualHint(pendingHint, player.hand)}
                </div>
                <Button
                  disabled={game.tokens.hints === 0}
                  onClick={() =>
                    onCommitAction({
                      action: "hint",
                      from: game.currentPlayer,
                      to: player.index,
                      ...pendingHint
                    } as IHintAction)
                  }
                >
                  Give hint
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (selectedArea.type === ActionAreaType.OWNGAME) {
    const { player } = selectedArea;
    const hasSelectedCard = selectedCard !== null;

    return (
      <div className="pa2 pa4-l bg-gray-light bt b--gray-light flex flex-column flex-grow-1">
        <div className="flex flex-row pb1 pb2-l f6 f4-l fw2 tracked ttu ml1 gray mb2">
          Your game
        </div>
        <div className="flex flex-row pb2">
          {player.hand.map((card, i) => (
            <Card
              key={i}
              card={card}
              hidden={player.id === playerId}
              position={i}
              size="large"
              context={CardContext.TARGETED_PLAYER}
              className="ma1"
              onClick={() => selectCard(i)}
              selected={selectedCard === i}
            />
          ))}
        </div>
        {isCurrentPlayer && (
          <>
            <div className="flex flex-row pb1 pb2-l f6 f4-l fw2 tracked ttu ml1 mb2 gray mt3">
              {hasSelectedCard && (
                <>Card {PositionMap[selectedCard]} selected</>
              )}
              {!hasSelectedCard && "Select a card"}
            </div>
            {hasSelectedCard && (
              <div className="flex flex-row pb2 ml1">
                {["play", "discard"].map(action => (
                  <Button
                    key={action}
                    onClick={() =>
                      onCommitAction({
                        action,
                        from: player.index,
                        cardIndex: selectedCard
                      })
                    }
                  >
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
};

function isCardHintable(hint: IHintAction, card: ICard) {
  if (hint.type === "color") {
    return card.color === hint.value;
  } else {
    return card.number === hint.value;
  }
}

function textualHint(hint: IHintAction, cards: ICard[]) {
  if (hint.value === null) {
    return "";
  }

  const hintableCards = cards
    .map((c, i) => (isCardHintable(hint, c) ? i : null))
    .filter(i => i !== null)
    .map(i => PositionMap[i]);

  if (hintableCards.length === 0) {
    if (hint.type === "color") return `You have no ${hint.value} cards.`;
    else return `You have no ${hint.value}s.`;
  } else if (hintableCards.length === 1) {
    if (hint.type === "color")
      return `Your card ${hintableCards[0]} is ${hint.value}!`;
    else return `Your card ${hintableCards[0]} is a ${hint.value}!`;
  } else {
    if (hint.type === "color")
      return `Your cards ${hintableCards.join(", ")} are ${hint.value}!`;
    else return `Your cards ${hintableCards.join(", ")} are ${hint.value}s!`;
  }
}