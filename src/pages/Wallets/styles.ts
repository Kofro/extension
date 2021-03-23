import styled from 'styled-components'

import background from '@assets/backgrounds/main.png'

const Wrapper = styled.div`
  height: 600px;
  overflow-x: scroll;
`

const Row = styled.div``

const Cover = styled.div`
  width: 100%;
  background-image: url(${background});
  background-repeat: no-repeat;
  background-position: bottom;
  position: fixed;
  z-index: 2;
  height: 290px;
`

const WalletsList = styled.div`
  position: relative;
  padding: 20px 30px;
  top: 290px;
`

const Balances = styled.div`
  padding: 10px 30px 0 30px;
`

const TotalBalanceLabel = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 19px;
  color: #ffffff;
`

const TotalBalance = styled.p`
  margin: 21px 0 0 0;
  font-weight: 500;
  font-size: 36px;
  line-height: 42px;
  color: #ffffff;
`

const TotalEstimated = styled.p`
  margin: 5px 0 10px 0;
  font-size: 20px;
  line-height: 23px;
  color: #ffffff;
`

const AddWalletBlock = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 30px;
  align-items: center;
`

const WalletsLabel = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  color: #ffffff;
`

const AddWalletButton = styled.button`
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  width: 60px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;

  &:hover {
    cursor: pointer;
    background-color: #ffffffcc;

    line {
      stroke: #31a76c;
    }
  }
`

const Styles = {
  Wrapper,
  Row,
  WalletsList,
  Cover,
  Balances,
  TotalBalanceLabel,
  TotalBalance,
  TotalEstimated,
  AddWalletBlock,
  WalletsLabel,
  AddWalletButton,
}

export default Styles
