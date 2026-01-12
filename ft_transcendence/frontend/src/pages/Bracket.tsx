// src/pages/Bracket.tsx
import React from 'react';

const Bracket = ({ bracket }: { bracket: TournamentBracket }) => {
  return (
    <div>
      <h3>Participants</h3>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {bracket.participants?.map((p, idx) => (
            <tr key={idx}>
              <td>{p.user.id}</td>
              <td>{p.user.name ?? "-"}</td>
              <td>{(p.user as any).email ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Matches</h3>
      <table>
        <thead>
          <tr>
            <th>Match</th>
            <th>Status</th>
            <th>Player 1</th>
            <th>Player 2</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {bracket.matches?.map((match, idx) => (
            <tr key={idx}>
              <td>Match {match.id}</td>
              <td>{match.status}</td>
              <td>{match.player1.name}</td>
              <td>{match.player2.name}</td>
              <td>{match.player1Score} - {match.player2Score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Bracket;

