// src/components/MarketsSection.tsx
import React from 'react';
import { IonCard, IonCardContent, IonChip, IonIcon, IonLabel } from '@ionic/react';
import { businessOutline, trendingUpOutline } from 'ionicons/icons';
import './MarketsSection.css';

const marketsData = [
  {
    country: 'USA',
    flag: '🇺🇸',
    exchange: 'NYSE',
    exchangeName: 'New York Stock Exchange',
    topStocks: ['AAPL', 'JPM', 'KO']
  },
  {
    country: 'USA',
    flag: '🇺🇸',
    exchange: 'NASDAQ',
    exchangeName: 'NASDAQ',
    topStocks: ['MSFT', 'GOOGL', 'TSLA']
  },
  {
    country: 'GB',
    flag: '🇬🇧',
    exchange: 'LSE',
    exchangeName: 'London Stock Exchange',
    topStocks: ['HSBC', 'BP', 'VOD']
  },
  {
    country: 'JP',
    flag: '🇯🇵',
    exchange: 'TSE',
    exchangeName: 'Tokyo Stock Exchange',
    topStocks: ['7203.T - Toyota', '6758.T - Sony', '9984.T - SoftBank']
  },
  {
    country: 'AU',
    flag: '🇦🇺',
    exchange: 'ASX',
    exchangeName: 'Australian Securities Exchange',
    topStocks: ['BHP - BHP Group', 'CBA - Commonwealth Bank', 'WBC - Westpac']
  }
];

const MarketsSection: React.FC = () => {
  return (
    <div className="markets-section">
      <div className="markets-header">
        <h2 className="markets-title">What Markets can you operate?</h2>
        <p className="markets-subtitle">Access major global stock exchanges with Nexus</p>
      </div>

      <div className="markets-grid">
        {marketsData.map((market, idx) => (
          <IonCard key={idx} className="market-card">
            <div className="market-card-header">
              
              <div className="market-info">
                <h3 className="market-country">{market.country}</h3>
                <p className="market-exchange">{market.exchangeName} ({market.exchange})</p>
              </div>
            </div>
            <IonCardContent>
              <div className="top-stocks">
                <div className="top-stocks-title">
                  <IonIcon icon={trendingUpOutline} />
                  <span>Top Stocks</span>
                </div>
                <div className="stock-chips">
                  {market.topStocks.map((stock, i) => (
                    <IonChip key={i} color="primary" outline>
                      <IonIcon icon={businessOutline} />
                      <IonLabel>{stock}</IonLabel>
                    </IonChip>
                  ))}
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    </div>
  );
};

export default MarketsSection;