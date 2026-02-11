# xGaffer ⚽📊  
**Data-Driven FPL Decision Engine**

xGaffer is an analytics-powered Fantasy Premier League (FPL) assistant designed to help managers make smarter picks, transfers, and captain decisions using real data from the official FPL API.

## 🚀 Features

### 🔍 Squad Analysis
- Validates formation
- Identifies injury & suspension risks
- Detects rotation risk
- Evaluates minutes reliability
- Highlights underperforming assets

### 🔁 Transfer Suggestions
- Recommends optimal 1FT / 2FT moves
- Compares expected points (xP)
- Evaluates fixture difficulty (3–6 GW horizon)
- Calculates hit (-4) value vs reward
- Flags bandwagon & trap picks

### 🗓 Fixture Intelligence
- Fixture swing detection
- Buy-before-the-run strategy
- Sell-before-the-drop alerts

### 👑 Captain Recommendations
- Based on:
  - Expected goal involvement
  - Opponent defensive strength
  - Home vs away performance
  - Minutes security

### 🧠 Advanced (Planned)
- Machine learning expected points model
- Personalized risk profile (safe vs aggressive mode)
- Chip optimization (Wildcard, Free Hit, Bench Boost)
- Double/Blank GW prediction assistant


## 🏗 System Architecture

### Data Layer
- Official FPL API (primary source)
- Optional:
  - Understat (xG/xA)
  - FBref advanced stats

### Backend
- Node.js + Express *(or Python alternative)*
- Data fetching & caching
- Transfer scoring engine
- Fixture rating algorithm

### Analysis Engine
Rule-based scoring model:

Example:
If avg_minutes < 60 → decrease reliability score
If fixture_difficulty ≤ 2 → boost expected points
If form rising + strong fixtures → green signal


Future:
- ML regression model for projected points

### Frontend
- React-based dashboard
- Team ID input
- Budget & transfer tracking
- Visual performance charts

---

## 📊 How Transfer Scoring Works

Each player is evaluated using:

- Expected points over next 4–6 GWs
- Fixture difficulty rating
- Minutes reliability
- Form trend
- Price value
- Ownership volatility

Final Score =  
(Weighted xP)

Fixture Adjustment

Minutes Security Score

Form Trend Modifier

Risk Penalty


---

## 🛠 Installation

```bash
git clone https://github.com/yourusername/xgaffer.git
cd xgaffer
npm install
npm run dev
For Python version:

pip install -r requirements.txt
python app.py
📡 API Reference
Official FPL API:

https://fantasy.premierleague.com/api/bootstrap-static/
Player team endpoint:

https://fantasy.premierleague.com/api/entry/{team_id}/event/{gw}/picks/
🎯 Roadmap
 Core transfer recommendation engine

 Captain algorithm v1

 Fixture swing analyzer

 Bench optimization

 ML expected points model

 Full UI dashboard

 Deployment (Vercel / Railway / Render)

📈 Project Goals
Remove emotional transfers

Improve long-term decision quality

Increase consistency over 38 gameweeks

Provide explainable recommendations (not black-box AI)

🧑‍💻 Author
Built by an FPL manager who got tired of knee-jerk transfers.

⚠ Disclaimer
This tool provides data-driven suggestions.
It does not guarantee green arrows.
Pep rotation is beyond scientific modeling.

⭐ Contributing
Pull requests are welcome.
For major changes, please open an issue first to discuss improvements.
