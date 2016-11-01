
class Chart extends React.Component{

    componentDidMount() {
        this.updateChart(this.props.chartData);
    };

    updateChart() {
        let chartName = this.props.chartName;
        let options = this.optionsSetter();
        return new Chartist.Line('#' + chartName, this.props.chartData, options);
    };

    shouldComponentUpdate() {
        return true;
    };

    componentDidUpdate(){
        this.updateChart(this.props.chartData);
    }

    optionsSetter() {
        let options = new Object();
        options.fullWidth = false;
        // options.chartPadding = {right: 40};
        options.plugins = [];
        options.plugins.push(Chartist.plugins.tooltip());
        options.plugins.push(Chartist.plugins.ctAxisTitle({
            axisX: {
                axisTitle: this.props.chartData.x_axis_title,
                axisClass: 'ct-axis-title',
                offset: {
                    x: 0,
                    y: 40
                },
                textAnchor: 'middle'
            },
            axisY: {
                axisTitle: this.props.chartData.y_axis_title,
                axisClass: 'ct-axis-title',
                offset: {
                    x: 0,
                    y: -20
                },
                textAnchor: 'middle',
                flipTitle: true
            }
        }));
        if ((this.props.multiSeriesChart == true)) {
            options.plugins.push(Chartist.plugins.legend({
                position: 'bottom'
            }));
        }
        options.axisY = {
            labelInterpolationFnc: function(value)
            {
                return Chartist.roundWithPrecision(value, 6);
            }
        }
        return options;
    };

    componentWillReceiveProps(newProps) {
        this.updateChart(newProps);
    }

    componentWillUnmount() {
        if (this.chartist) {
            try {
                this.chartist.detach();
            } catch (err) {
                throw new Error('Internal chartist error', err);
            }
        }
    }

    render() {
        return (
               <div id={this.props.chartName} className='ct-chart'>
               </div>
       );
    }
};

class Charts extends React.Component
{
    render() {
        let graphsData = this.props.graphsData;
        let charts = Object.keys(graphsData).map((chartName, index)=>
        {
            let chartData = graphsData[chartName];
            let multiSeriesChart = false;
            if(chartData.series.length > 1)
            {
                multiSeriesChart = true;
            }
            return (<div><div key = {chartName}>
                <div>
                    <h1>{chartData.title}</h1>
                    <span className="ct-chart-description">{chartData.description}</span>
                </div>
                    <Chart key = {chartName} chartName = {chartName} chartData = {chartData}
                           multiSeriesChart = {multiSeriesChart} {...this.props}/>

                </div><hr className="ct-chart-seprator"/></div>);
        });
        let returnValue = <div id="charts"> </div>;
        if(charts.length > 0)
        {
            returnValue = <div id="charts">{charts}</div>;
        }
        return returnValue;
    }
};



class ChartDashboard extends React.Component{
    static propTypes: {
        globalOptions: React.PropTypes.array,
        graphsData: React.PropTypes.object.isRequired,
        dataProcessFunc: React.PropTypes.func,
        multiSeries: React.PropTypes.boolean,
    };

    static defaultProps : {
        globalOptions: [],
        graphsData: {},
        multiSeries: false,
    };

    render() {
        return (<Charts {...this.props}/> );
    }
};

/**
 * Checks if the given graphs is of SLA rule type that has multiple transaction and therefore
 * requires legend and multiple series support
 * @param graphKey - the graph name (as defined in the data object given.
 * @returns boolean iff it's of multiple transaction type.
 */
function isMultipleTransactionGraph(graphKey) {
    if(graphKey == 'averageTransactionResponseTime' || graphKey == 'percentileTransaction')
    {
        return true;
    }

    return false;
};

/**
 * Updates the graph view per scenario key
 * @param scenarioKey - the selected scenario
 */
function updateGraphs(scenarioKey)
{
    instance.getGraphData(function(t)
    {
        let graphsData = (t.responseObject())[scenarioKey];
        ReactDOM.render(<ChartDashboard graphsData = {graphsData.scenarioData} dataProcessFunc = {isMultipleTransactionGraph}/>
            ,document.querySelector('.graphCon'));
        ReactDOM.render(<ScenarioTable scenName = {scenarioKey} scenData = {graphsData.scenarioStats}/>,
            document.querySelector('.scenarioSummary'));

    });
};

var Dropdown = React.createClass({

    propTypes: {
        id: React.PropTypes.string.isRequired,
        options: React.PropTypes.array.isRequired,
        value: React.PropTypes.oneOfType(
            [
                React.PropTypes.object,
                React.PropTypes.string
            ]
        ),
        valueField: React.PropTypes.string,
        labelField: React.PropTypes.string,
        onChange: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            value: null,
            valueField: 'value',
            labelField: 'label',
            onChange: null
        };
    },

    getInitialState: function() {
        var selected = this.getSelectedFromProps(this.props);
        // console.log(JSON.stringify(selected));
        updateGraphs(selected);
        return {
            selected: selected
        }
    },

    componentWillReceiveProps: function(nextProps) {
        var selected = this.getSelectedFromProps(nextProps);
        this.setState({
            selected: selected
        });
    },

    getSelectedFromProps(props) {
        var selected;
        if (props.value === null && props.options.length !== 0) {
            selected = props.options[0][props.valueField];
        } else {
            selected = props.value;
        }
        return selected;
    },

    render: function() {
        var self = this;
        var options = self.props.options.map(function(option) {
            return (
                <option key={option[self.props.valueField]} value={option[self.props.valueField]}>
                    {option[self.props.labelField]}
                </option>
            )
        });
        return (
            <select id={this.props.id}
                    className='form-control'
                    value={this.state.selected}
                    onChange={this.handleChange}>
                {options}
            </select>
        );
    },

    handleChange: function(e) {
        if (this.props.onChange) {
            var change = {
                oldValue: this.state.selected,
                newValue: e.target.value
            };
            this.props.onChange(change);
        }
        this.setState({selected: e.target.value});
    }

});

var dropDownOnChange = function(change) {
    updateGraphs(change.newValue);
};

instance.getScenarioList(function(t)
{
    let tData = t.responseObject();
    ReactDOM.render(<div>
            <span>
                Scenario name:
            </span>
            <Dropdown id='myDropdown' options= {tData} labelField='ScenarioName' valueField='ScenarioName' onChange={dropDownOnChange}/>
        </div>, document.getElementById('scenarioDropDown'));
});

class ScenarioTable extends React.Component{
    staticpropTypes: {
        scenName: React.PropTypes.string.isRequired,
        scenData: React.PropTypes.array.isRequired,
    };

    render() {
        const tableId = this.props.scenarioKey + '_table'
        const time = this.props.scenData.AvgScenarioDuration.AvgDuration;

        const days = Math.floor(time / 86400);
        const hours = Math.floor((time - (86400 * days)) / 3600);
        const minutes = Math.floor((time - (3600 * hours)) / 60);
        const seconds = Math.floor(time - (60 * minutes));

        return (<div id={this.props.scenarioKey} className='scenario-stats'>
            <table className="st-table">
                <thead className="st-table-head">
                    <tr className="st-table-row">
                        <th className="st-table-header">
                            Average duration
                            (Days:Hours:Min:Sec)
                        </th>
                        <th className="st-table-header">
                            Average total transaction state
                        </th>
                        <th className="st-table-header">
                            Average maximum connections
                        </th>
                        <th className="st-table-header">
                            Average maximum VUsers
                        </th>
                    </tr>
                </thead>
                <tbody className="st-table-body">
                    <tr className="st-table-row">
                        <td className="st-table-cell">
                            {days}:{hours}:{minutes}:{seconds}
                        </td>
                        <td className = "st-table-cell">
                            <td className = "st-table-inner-cell">
                                <img src="/plugin/hp-application-automation-tools-plugin/icons/16x16/passed.png" alt="Passed:"/>
                                {this.props.scenData.TransactionSummary.Pass} Passed
                            </td>
                            <td className = "st-table-inner-cell">
                                <img src="/plugin/hp-application-automation-tools-plugin/icons/16x16/stop.png" alt="Stopped:"/>
                                {this.props.scenData.TransactionSummary.Stop} Stopped
                            </td>
                            <td className = "st-table-inner-cell">
                                <img src="/plugin/hp-application-automation-tools-plugin/icons/16x16/failed.png" alt="Failed:"/>
                                {this.props.scenData.TransactionSummary.Fail} Failed
                            </td>
                        </td>
                        <td className="st-table-cell">
                            {this.props.scenData.AvgMaxConnections.AvgMaxConnection}
                        </td>
                        <td className="st-table-cell">
                            {this.props.scenData.VUserSummary.AvgMaxVuser}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>);
    }
};