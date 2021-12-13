/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-undef */
class SymbolSettingIconGridSell extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gridTrade: [],
      canAddNewGridTrade: true,
      validation: []
    };

    this.handleInputChange = this.handleInputChange.bind(this);

    this.onAddGridTrade = this.onAddGridTrade.bind(this);
    this.onRemoveGridTrade = this.onRemoveGridTrade.bind(this);
    this.validateGridTrade = this.validateGridTrade.bind(this);
  }

  componentDidUpdate(nextProps) {
    // Only update configuration, when the modal is closed and different.
    if (
      _.isEmpty(nextProps.gridTrade) === false &&
      _.isEqual(nextProps.gridTrade, this.state.gridTrade) === false
    ) {
      const { gridTrade } = nextProps;

      this.setState({
        gridTrade
      });
      this.validateGridTrade(gridTrade);
    }
  }

  handleInputChange(event) {
    const target = event.target;
    const value =
      target.type === 'checkbox'
        ? target.checked
        : target.type === 'number'
        ? +target.value
        : target.value;
    const stateKey = target.getAttribute('data-state-key');

    const { gridTrade } = this.state;

    const newGridTrade = _.set(gridTrade, stateKey, value);

    this.setState({
      gridTrade: newGridTrade
    });
    this.validateGridTrade(newGridTrade);

    this.props.handleGridTradeChange('sell', newGridTrade);
  }

  onAddGridTrade(_event) {
    const { gridTrade } = this.state;
    const lastGridTrade = _.cloneDeep(_.last(gridTrade));
    let newGridTrade;
    if (lastGridTrade) {
      lastGridTrade.executed = false;
      lastGridTrade.executedOrder = null;
      // If the grid trade has existing grid data, then use the last row to create new grid trade.
      newGridTrade = _.concat(gridTrade, lastGridTrade);
    } else {
      newGridTrade = _.concat(gridTrade, {
        triggerPercentage: 1.06,
        stopPercentage: 0.98,
        limitPercentage: 0.979,
        quantityPercentage: 1
      });
    }

    this.setState({
      gridTrade: newGridTrade
    });

    this.validateGridTrade(newGridTrade);
    this.props.handleGridTradeChange('sell', newGridTrade);
  }

  onRemoveGridTrade(index) {
    const { gridTrade } = this.state;

    _.pullAt(gridTrade, index);

    this.setState({
      gridTrade
    });
    this.validateGridTrade(gridTrade);
    this.props.handleGridTradeChange('sell', gridTrade);
  }

  /**
   * Validate grid trade for selling
   *
   *  - The trigger percentage cannot be lower than the previous trigger percentage.
   *  - The sell quantity percentage cannot be more than 1.
   *  - The sell quantity percentage cannot be equal or less than 0.
   *  - If the last sell quantity percentage is 1, the new grid trade cannot be added.
   *  - If the last sell quantity percentage is less than 1, then display the warning message.
   *  - The limit price percentage cannot be over the stop price percentage.
   */
  validateGridTrade(gridTrade) {
    const validation = [];

    let isValid = true;
    let canAddNewGridTrade = true;

    gridTrade.forEach((grid, index) => {
      const v = {
        messages: [],
        triggerPercentage: true,
        stopPercentage: true,
        limitPercentage: true,
        quantityPercentage: true
      };

      if (index > 0) {
        const prevGrid = gridTrade[index - 1];
        // The trigger percentage cannot be lower than the previous trigger percentage.
        if (prevGrid.triggerPercentage >= grid.triggerPercentage) {
          isValid = false;
          v.triggerPercentage = false;
          v.messages.push(
            `The trigger percentage cannot be lower than the previous trigger percentage.`
          );
        }
      }

      // If the limit price percentage cannot be higher than the stop price percentage.
      if (grid.limitPercentage >= grid.stopPercentage) {
        isValid = false;
        v.limitPercentage = false;
        v.messages.push(
          `The limit price percentage cannot be equal or over the stop percentage.`
        );
      }

      // The sell quantity percentage cannot be equal or less than 0.
      if (parseFloat(grid.quantityPercentage) <= 0) {
        isValid = false;
        v.quantityPercentage = false;
        v.messages.push(
          `The quantity percentage is cannot be equal or less than 0.`
        );
      }
      // The sell quantity percentage cannot be more than 1.
      if (parseFloat(grid.quantityPercentage) > 1) {
        isValid = false;
        v.quantityPercentage = false;
        v.messages.push(`The quantity percentage is cannot be more than 1.`);
      }

      // If the grid trade is the last grade trade
      if (gridTrade.length === index + 1) {
        // If the last sell quantity percentage is less than 1,
        if (parseFloat(grid.quantityPercentage) < 1) {
          v.messages.push(
            `The quantity percentage is less than 1. The bot will not sell all the quantities you have.`
          );
        }
        // If the last sell quantity percentage is 1, the new grid trade cannot be added.
        if (parseFloat(grid.quantityPercentage) >= 1) {
          canAddNewGridTrade = false;
        }
      }

      validation.push(v);
    });

    this.setState({
      canAddNewGridTrade,
      validation
    });
    this.props.handleSetValidation('gridBuy', isValid);
  }

  render() {
    const { gridTrade, validation, canAddNewGridTrade } = this.state;

    const gridRows = gridTrade.map((grid, i) => {
      const validationText = _.get(validation, `${i}.messages`, []).reduce(
        (acc, message, k) => [
          ...acc,
          <div
            key={'error-message-' + i + '-' + k}
            className='field-error-message text-danger'>
            <i className='fas fa-exclamation-circle mx-1'></i>
            {message}
          </div>
        ],
        []
      );

      return (
        <React.Fragment key={'grid-row-sell-' + i}>
          <tr>
            <td className='align-middle font-weight-bold' width='90%'>
              #{i + 1}-卖单
            </td>
            <td className='align-middle text-center'>
              {i !== 0 && grid.executed !== true ? (
                <button
                  type='button'
                  className='btn btn-sm btn-link p-0'
                  onClick={() => this.onRemoveGridTrade(i)}>
                  <i className='fas fa-times-circle text-danger'></i>
                </button>
              ) : (
                ''
              )}
            </td>
          </tr>
          <tr>
            <td colSpan='2'>
              <div className='row'>
                <div className='col-xs-12 col-sm-6'>
                  <Form.Group
                    controlId={'field-grid-sell-' + i + '-trigger-percentage'}
                    className='mb-2'>
                    <Form.Label className='mb-0'>
                      触发挂单价（%）{' '}
                      <strong>基于最后买入价格</strong>{' '}
                      <OverlayTrigger
                        trigger='click'
                        key={
                          'field-grid-sell-' + i + '-trigger-percentage-overlay'
                        }
                        placement='bottom'
                        overlay={
                          <Popover
                            id={
                              'field-grid-sell-' +
                              i +
                              '-trigger-percentage-overlay-right'
                            }>
                            <Popover.Content>
                              Set the trigger percentage for minimum profit.
                              i.e. if set <code>1.06</code>, minimum profit will
                              be <code>6%</code>. So if the last sell price is{' '}
                              <code>$100</code>, then the bot will sell the coin
                              when the current price reaches <code>$106</code>.
                            </Popover.Content>
                          </Popover>
                        }>
                        <Button
                          variant='link'
                          className='p-0 m-0 ml-1 text-info'>
                          <i className='fas fa-question-circle fa-sm'></i>
                        </Button>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      size='sm'
                      type='number'
                      placeholder='Enter trigger percentage'
                      required
                      min='1'
                      step='0.0001'
                      isInvalid={
                        _.get(validation, `${i}.triggerPercentage`, true) ===
                        false
                      }
                      disabled={grid.executed}
                      data-state-key={`${i}.triggerPercentage`}
                      value={grid.triggerPercentage}
                      onChange={this.handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className='col-xs-12 col-sm-6'>
                  <Form.Group
                    controlId={'field-grid-sell-' + i + '-stop-percentage'}
                    className='mb-2'>
                    <Form.Label className='mb-0'>
                     止损价（%）{' '}
                      <OverlayTrigger
                        trigger='click'
                        key={
                          'field-grid-sell-' +
                          i +
                          '-stop-price-percentage-overlay'
                        }
                        placement='bottom'
                        overlay={
                          <Popover
                            id={
                              'field-grid-sell-' +
                              i +
                              '-stop-price-percentage-overlay-right'
                            }>
                            <Popover.Content>
                              Set the percentage to calculate stop price. i.e.
                              if set <code>0.99</code> and current price{' '}
                              <code>$106</code>, stop price will be{' '}
                              <code>$104.94</code> for stop limit order.
                            </Popover.Content>
                          </Popover>
                        }>
                        <Button
                          variant='link'
                          className='p-0 m-0 ml-1 text-info'>
                          <i className='fas fa-question-circle fa-sm'></i>
                        </Button>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      size='sm'
                      type='number'
                      placeholder='Enter stop price percentage'
                      required
                      min='0'
                      step='0.0001'
                      isInvalid={
                        _.get(validation, `${i}.stopPercentage`, true) === false
                      }
                      disabled={grid.executed}
                      data-state-key={`${i}.stopPercentage`}
                      value={grid.stopPercentage}
                      onChange={this.handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className='col-xs-12 col-sm-6'>
                  <Form.Group
                    controlId={'field-grid-sell-' + i + '-limit-percentage'}
                    className='mb-2'>
                    <Form.Label className='mb-0'>
                      卖出价（%）{' '}
                      <OverlayTrigger
                        trigger='click'
                        key={
                          'field-grid-sell-' + i + '-limit-percentage-overlay'
                        }
                        placement='bottom'
                        overlay={
                          <Popover
                            id={
                              'field-grid-sell-' +
                              i +
                              '-limit-percentage-overlay-right'
                            }>
                            <Popover.Content>
                              Set the percentage to calculate limit price. i.e.
                              if set <code>0.98</code> and current price{' '}
                              <code>$106</code>, limit price will be{' '}
                              <code>$103.88</code> for stop limit order.
                            </Popover.Content>
                          </Popover>
                        }>
                        <Button
                          variant='link'
                          className='p-0 m-0 ml-1 text-info'>
                          <i className='fas fa-question-circle fa-sm'></i>
                        </Button>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      size='sm'
                      type='number'
                      placeholder='Enter limit price percentage'
                      required
                      min='0'
                      step='0.0001'
                      isInvalid={
                        _.get(validation, `${i}.limitPercentage`, true) ===
                        false
                      }
                      disabled={grid.executed}
                      data-state-key={`${i}.limitPercentage`}
                      value={grid.limitPercentage}
                      onChange={this.handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className='col-xs-12 col-sm-6'>
                  <Form.Group
                    controlId={'field-grid-sell-' + i + '-quantity-percentage'}
                    className='mb-2'>
                    <Form.Label className='mb-0'>
                      卖出比例{' '}
                      <OverlayTrigger
                        trigger='click'
                        key={
                          'field-grid-sell-' +
                          i +
                          '-quantity-percentage-overlay'
                        }
                        placement='bottom'
                        overlay={
                          <Popover
                            id={
                              'field-grid-sell-' +
                              i +
                              '-quantity-percentage-overlay-right'
                            }>
                            <Popover.Content>
                              Set the quantity percentage for selling. i.e. if
                              set <code>0.5</code>
                              and own <code>50</code> coins, then it will only
                              sell <code>25</code> of owned coins. If set{' '}
                              <code>1</code>, then it will sell{' '}
                              <code>100%</code> of owned coins.
                            </Popover.Content>
                          </Popover>
                        }>
                        <Button
                          variant='link'
                          className='p-0 m-0 ml-1 text-info'>
                          <i className='fas fa-question-circle fa-sm'></i>
                        </Button>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      size='sm'
                      type='number'
                      placeholder={'Enter quantity percentage'}
                      required
                      min='0.0001'
                      max='1'
                      step='0.0001'
                      isInvalid={
                        _.get(validation, `${i}.quantityPercentage`, true) ===
                        false
                      }
                      disabled={grid.executed}
                      data-state-key={`${i}.quantityPercentage`}
                      value={grid.quantityPercentage}
                      onChange={this.handleInputChange}
                    />
                  </Form.Group>
                </div>
                {validationText !== '' ? (
                  <div className='col-12'>{validationText}</div>
                ) : (
                  ''
                )}
              </div>
            </td>
          </tr>
        </React.Fragment>
      );
    });

    return (
      <div className='coin-info-grid-trade-wrapper coin-info-grid-trade-sell-wrapper'>
        <Table striped bordered hover size='sm'>
          <tbody>{gridRows}</tbody>
        </Table>
        <div className='row'>
          <div className='col-12 text-right'>
            <button
              type='button'
              disabled={!canAddNewGridTrade}
              className='btn btn-sm btn-add-new-grid-trade-sell'
              onClick={this.onAddGridTrade}>
              添加新的卖单
            </button>
          </div>
        </div>
      </div>
    );
  }
}
