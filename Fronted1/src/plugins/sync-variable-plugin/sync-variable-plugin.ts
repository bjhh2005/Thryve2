import {
  definePluginCreator,
  FlowNodeVariableData,
  getNodeForm,
  PluginCreator,
  FreeLayoutPluginContext,
  ASTFactory,
} from '@flowgram.ai/free-layout-editor';
import { JsonSchemaUtils } from '@flowgram.ai/form-materials';
import { WorkflowNodeType } from '../../nodes/constants';

export interface SyncVariablePluginOptions {}

/**
 * Creates a plugin to synchronize output data to the variable engine when nodes are created or updated.
 * @param ctx - The plugin context, containing the document and other relevant information.
 * @param options - Plugin options, currently an empty object.
 */
export const createSyncVariablePlugin: PluginCreator<SyncVariablePluginOptions> =
  definePluginCreator<SyncVariablePluginOptions, FreeLayoutPluginContext>({
    onInit(ctx, options) {
      const flowDocument = ctx.document;

      // Listen for node creation events
      flowDocument.onNodeCreate(({ node }) => {
        const form = getNodeForm(node);
        const variableData = node.getData(FlowNodeVariableData);

        /**
         * Synchronizes output data to the variable engine.
         * @param value - The output data to synchronize.
         */
        const syncOutputs = (value: any) => {
          if (!value) {
            // If the output data is empty, clear the variable
            variableData.clearVar();
            return;
          }

          // 处理文件输入节点
          if (node.type === WorkflowNodeType.FileInput) {
            // 先清除所有已存在的变量
            variableData.clearVar();
            
            const files = form?.getValueIn('files') || [];
            files.forEach((fileEntry: { file: { fileName: string; filePath: string }; variableName: string }) => {
                if (!fileEntry.file) return;
                
                variableData.setVar(
                    ASTFactory.createVariableDeclaration({
                        meta: {
                            title: fileEntry.file.fileName,
                            icon: node.getNodeRegistry()?.info?.icon,
                        },
                        key: `${node.id}_${fileEntry.variableName}`,
                        type: ASTFactory.createString(),
                        initializer: {
                            kind: 'String',
                            value: fileEntry.file.filePath
                        }
                    })
                );
            });
            return;
          }

          // Handle folder input node
          if (node.type === WorkflowNodeType.FolderInput) {
            console.log('Syncing folder input node:', node.id);
            
            // Clear existing variables
            variableData.clearVar();
            
            // Get outputs from form
            const outputs = form?.getValueIn('outputs');
            console.log('Folder node outputs:', outputs);
            
            if (!outputs?.properties) {
                console.warn('No outputs properties found');
                return;
            }

            // Iterate through all properties
            Object.entries(outputs.properties).forEach(([key, property]: [string, any]) => {
                console.log('Processing property:', { key, property });
                
                if (!property.isOutput) {
                    console.log('Skipping non-output property:', key);
                    return;
                }

                if (property.type === 'string') {
                    console.log('Registering string variable:', {
                        key: `${node.id}_${key}`,
                        title: property.title,
                        value: property.default
                    });
                    
                    // Register folder path variable
                    variableData.setVar(
                        ASTFactory.createVariableDeclaration({
                            meta: {
                                title: property.title,
                                icon: node.getNodeRegistry()?.info?.icon,
                            },
                            key: `${node.id}_${key}`,
                            type: ASTFactory.createString(),
                            initializer: {
                                kind: 'String',
                                value: property.default
                            }
                        })
                    );
                } else if (property.type === 'array' && property.items?.type === 'string') {
                    console.log('Registering array variable:', {
                        key: `${node.id}_${key}`,
                        title: property.title,
                        elements: property.default
                    });
                    
                    // Register files list variable
                    variableData.setVar(
                        ASTFactory.createVariableDeclaration({
                            meta: {
                                title: property.title,
                                icon: node.getNodeRegistry()?.info?.icon,
                            },
                            key: `${node.id}_${key}`,
                            type: {
                                kind: 'Array',
                                items: {
                                    kind: 'String'
                                }
                            },
                            initializer: {
                                kind: 'Array',
                                elements: (property.default || []).map((file: string) => ({
                                    kind: 'String',
                                    value: file
                                }))
                            }
                        })
                    );
                }
            });

            console.log('Finished syncing folder input node');
            return;
          }

          // 处理其他类型节点
          const typeAST = JsonSchemaUtils.schemaToAST(value);

          if (typeAST) {
            // Use the node's title or its ID as the title for the variable
            const title = form?.getValueIn('title') || node.id;

            // Set the variable in the variable engine
            variableData.setVar(
              ASTFactory.createVariableDeclaration({
                meta: {
                  title: `${title}`,
                  icon: node.getNodeRegistry()?.info?.icon,
                },
                key: `${node.id}`,
                type: typeAST,
              })
            );
          } else {
            // If the AST cannot be created, clear the variable
            variableData.clearVar();
          }
        };

        if (form) {
          // Initially synchronize the output data
          syncOutputs(form.getValueIn('outputs'));

          // Listen for changes in the form values and re-synchronize when outputs change
          form.onFormValuesChange((props) => {
            // // 跳过文件输入节点的变化监听
            // if (node.type === WorkflowNodeType.FileInput) {
            //   return;
            // }
            
            if (props.name.match(/^outputs/) || props.name.match(/^title/)) {
              syncOutputs(form.getValueIn('outputs'));
            }
          });
        }
      });
    },
  });
